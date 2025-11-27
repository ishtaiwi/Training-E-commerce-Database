const {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  ChangeMessageVisibilityCommand,
  CreateQueueCommand
} = require('@aws-sdk/client-sqs');
const { logger } = require('../utils/logger');

let sqsClient;
const region = process.env.AWS_REGION;
const queueUrl = process.env.SQS_QUEUE_URL;
const endpoint = process.env.SQS_ENDPOINT;
let queueEnsured = false;

function isConfigured() {
  return Boolean(region && queueUrl);
}

function getClient() {
  if (!isConfigured()) {
    throw new Error('SQS is not configured. Missing AWS_REGION or SQS_QUEUE_URL.');
  }
  if (!sqsClient) {
    const config = { region };
    if (endpoint) {
      config.endpoint = endpoint;
    }
    sqsClient = new SQSClient(config);
  }
  return sqsClient;
}

function getQueueNameFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1];
  } catch (err) {
    const parts = String(url).split('/').filter(Boolean);
    return parts[parts.length - 1];
  }
}

async function ensureQueueExists() {
  if (queueEnsured || !isConfigured()) {
    return;
  }
  if (!endpoint) {
    return;
  }
  const name = getQueueNameFromUrl(queueUrl);
  if (!name) {
    return;
  }
  try {
    const client = getClient();
    await client.send(new CreateQueueCommand({ QueueName: name }));
    queueEnsured = true;
    logger.info('Ensured SQS queue exists', { queueUrl, name });
  } catch (err) {
    logger.warn('Failed to ensure SQS queue exists', { err, queueUrl, name });
  }
}

async function enqueueTask(type, payload = {}, options = {}) {
  if (!isConfigured()) {
    logger.warn('SQS not configured; skipping enqueue', { type });
    return;
  }
  const message = {
    type,
    payload,
    ts: Date.now()
  };
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
    ...options
  });
  try {
    await getClient().send(command);
  } catch (err) {
    if (err.name === 'QueueDoesNotExist' || err.Code === 'AWS.SimpleQueueService.NonExistentQueue') {
      await ensureQueueExists();
      logger.warn('SQS queue did not exist when enqueueing; attempted to create it', { type });
      return;
    }
    throw err;
  }
}

async function receiveMessages(params = {}) {
  if (!isConfigured()) {
    logger.warn('SQS not configured; receiveMessages skipped');
    return [];
  }
  const command = new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: params.maxNumberOfMessages ?? 5,
    WaitTimeSeconds: params.waitTimeSeconds ?? 20,
    VisibilityTimeout: params.visibilityTimeout ?? 60,
    ...params.extra
  });
  try {
    const response = await getClient().send(command);
    return response.Messages || [];
  } catch (err) {
    if (err.name === 'QueueDoesNotExist' || err.Code === 'AWS.SimpleQueueService.NonExistentQueue') {
      await ensureQueueExists();
      logger.warn('SQS queue did not exist when receiving; attempted to create it');
      return [];
    }
    throw err;
  }
}

async function deleteMessage(receiptHandle) {
  if (!isConfigured()) {
    return;
  }
  if (!receiptHandle) {
    return;
  }
  const command = new DeleteMessageCommand({
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle
  });
  await getClient().send(command);
}

async function extendVisibility(receiptHandle, timeoutSeconds) {
  if (!isConfigured()) {
    return;
  }
  const command = new ChangeMessageVisibilityCommand({
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle,
    VisibilityTimeout: timeoutSeconds
  });
  await getClient().send(command);
}

module.exports = {
  enqueueTask,
  receiveMessages,
  deleteMessage,
  extendVisibility,
  isConfigured,
  getClient 
};

