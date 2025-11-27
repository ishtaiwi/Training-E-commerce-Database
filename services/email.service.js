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
      // Ensure 'to' field is present and valid
      if (!options.to) {
        logger.error('Email recipient (to) is required', { subject: options.subject });
        throw new Error('Email recipient (to) is required');
      }
      
      // For Gmail SMTP, if FROM address doesn't match authenticated user, Gmail may:
      // 1. Reject the email, or
      // 2. Send copies to the authenticated account (osamaishtaiwi3@gmail.com)
      // To prevent this, use the authenticated account as FROM, or configure Gmail "Send mail as"
      const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
      
      const mailOptions = {
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        // Only add BCC if explicitly provided
        ...(options.bcc ? { bcc: options.bcc } : {})
      };
      
      // Prevent sending copy to admin unless explicitly requested
      // Gmail auto-BCC behavior: if FROM doesn't match SMTP_USER, it may send copies
      // Solution: Set SMTP_FROM_EMAIL to match SMTP_USER to prevent auto-BCC
      
      await this.transporter.sendMail(mailOptions);
    } catch (err) {
      // Log the error but do NOT throw, so background jobs (queue worker) don't fail hard
      logger.error('Failed to send email', { message: err.message, stack: err.stack, to: options.to, subject: options.subject });
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

  async sendOrderReceipt(to, { order, user }) {
    const subject = `Your order ${order._id} confirmation`;
    const itemLines = (order.items || []).map(item => {
      const name = item.product && item.product.name ? item.product.name : 'Item';
      const price = Number(item.priceAtPurchase || 0).toFixed(2);
      return `<li>${name} &times; ${item.quantity} - $${price}</li>`;
    }).join('');
    const total = Number(order.total || 0).toFixed(2);
    const html = `
      <p>Hi ${user.name || ''},</p>
      <p>Thanks for your order. Here is a quick summary:</p>
      <ul>
        ${itemLines}
      </ul>
      <p><strong>Total:</strong> $${total}</p>
      <p>We will notify you once your items ship.</p>
    `;
    await this.sendMail({ to, subject, html });
  }
}

module.exports = new EmailService();

