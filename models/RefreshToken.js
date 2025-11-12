const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  type: { type: String, enum: ['refresh', 'email_verification', 'password_reset'], default: 'refresh', index: true },
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  createdByIp: { type: String },
  userAgent: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  revokedAt: { type: Date },
  revokedByIp: { type: String },
  replacedByTokenHash: { type: String },
  consumedAt: { type: Date }
});

refreshTokenSchema.methods.isExpired = function () {
  if (!this.expiresAt) {
    return true; // Consider expired if no expiry date
  }
  return Date.now() >= this.expiresAt.getTime();
};

refreshTokenSchema.methods.isActive = function () {
  return !this.revokedAt && !this.consumedAt && !this.isExpired();
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);

