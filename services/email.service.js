const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.disabled = false;
  }

  initialize() {
    if (this.initialized) return;
    this.initialized = true;

    const missing = [];
    if (!process.env.SMTP_HOST) missing.push('SMTP_HOST');
    if (!process.env.SMTP_PORT) missing.push('SMTP_PORT');
    if (!process.env.SMTP_USER) missing.push('SMTP_USER');
    if (!process.env.SMTP_PASS) missing.push('SMTP_PASS');
    if (!process.env.SMTP_FROM_EMAIL) missing.push('SMTP_FROM_EMAIL');

    if (missing.length) {
      this.disabled = true;
      logger.warn('Email service disabled. Missing SMTP configuration.', { missing });
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  isEnabled() {
    this.initialize();
    return !this.disabled;
  }

  async sendMail(options) {
    this.initialize();
    if (this.disabled) {
      logger.info('Email service disabled. Email not sent.', { to: options.to, subject: options.subject });
      return;
    }
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL,
        ...options
      });
    } catch (err) {
      logger.error('Failed to send email', { err, to: options.to, subject: options.subject });
      throw err;
    }
  }

  async sendEmailVerification(to, { verifyUrl, token }) {
    const subject = 'Verify your email address';
    const html = `
      <p>Hello,</p>
      <p>Please verify your email address${verifyUrl ? ' by clicking the link below' : ''}.</p>
      ${verifyUrl ? `<p><a href="${verifyUrl}">${verifyUrl}</a></p>` : ''}
      ${!verifyUrl && token ? `<p>Your verification token is:</p><p><code>${token}</code></p>` : ''}
      <p>If you did not sign up for this account, you can ignore this email.</p>
    `;
    await this.sendMail({ to, subject, html });
  }

  async sendPasswordReset(to, { resetUrl, token }) {
    const subject = 'Reset your password';
    const html = `
      <p>Hello,</p>
      <p>We received a request to reset your password.${resetUrl ? ' Click the link below to choose a new password:' : ''}</p>
      ${resetUrl ? `<p><a href="${resetUrl}">${resetUrl}</a></p>` : ''}
      ${!resetUrl && token ? `<p>Your reset token is:</p><p><code>${token}</code></p>` : ''}
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `;
    await this.sendMail({ to, subject, html });
  }
}

module.exports = new EmailService();

