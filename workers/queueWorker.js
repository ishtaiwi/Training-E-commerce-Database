const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const { logger } = require('../utils/logger');
const { receiveMessages, deleteMessage, extendVisibility, isConfigured } = require('../services/queue.service');
const emailService = require('../services/email.service');
const Order = require('../models/Order');
const User = require('../models/User');
require('../models/Product'); // Ensure Product model is registered for population

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  logger.error('MONGO_URI is required to run the queue worker');
  process.exit(1);
}

if (!isConfigured()) {
  logger.error('SQS configuration missing (AWS_REGION / SQS_QUEUE_URL). Queue worker cannot start.');
  process.exit(1);
}

async function connectMongo() {
  await mongoose.connect(MONGO_URI);
  logger.info('Queue worker connected to MongoDB');
}

async function handleOrderConfirmation(payload = {}) {
  const { orderId } = payload;
  if (!orderId) {
    throw new Error('ORDER_CONFIRMATION payload missing orderId');
  }

  const order = await Order.findById(orderId).populate('items.product user');
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  let user = order.user;
  if (!user || !user.email) {
    user = await User.findById(order.user);
  }

  if (!user || !user.email) {
    logger.warn('Order has no user email; skipping notification', { orderId });
    return;
  }

  if (!emailService.isEnabled()) {
    logger.warn('Email service disabled; cannot send order confirmation', { orderId });
    return;
  }

  await emailService.sendOrderReceipt(user.email, { order, user });
  logger.info('Order confirmation email sent', { orderId, userId: user._id });
}

const handlers = {
  ORDER_CONFIRMATION: handleOrderConfirmation
};

async function processMessage(message) {
  const { Body, ReceiptHandle } = message;
  if (!Body) {
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(Body);
  } catch (err) {
    logger.error('Failed to parse message body', { err, body: Body });
    return;
  }
  const handler = handlers[parsed.type];

  if (!handler) {
    logger.warn('No handler for message type', { type: parsed.type });
    return;
  }

  const visibilityExtensionSeconds = 120;
  const visibilityTimer = setInterval(() => {
    extendVisibility(ReceiptHandle, visibilityExtensionSeconds).catch(err => {
      logger.error('Failed to extend message visibility', { err });
    });
  }, (visibilityExtensionSeconds - 30) * 1000);

  try {
    await handler(parsed.payload);
    await deleteMessage(ReceiptHandle);
    clearInterval(visibilityTimer);
  } catch (err) {
    clearInterval(visibilityTimer);
    logger.error('Failed to process queue message', {
      type: parsed.type,
      message: err.message,
      stack: err.stack
    });
    throw err;
  }
}

async function poll() {
  while (true) {
    try {
      const messages = await receiveMessages();
      if (!messages.length) {
        continue;
      }
      for (const message of messages) {
        try {
          await processMessage(message);
        } catch (err) {
          // leave message for retry / DLQ
        }
      }
    } catch (err) {
      logger.error('Queue polling failed', { err });
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function start() {
  await connectMongo();
  logger.info('Queue worker started. Listening for messages...');
  await poll();
}

start().catch(err => {
  logger.error('Queue worker crashed during startup', { err });
  process.exit(1);
});

