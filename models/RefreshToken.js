const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  createdByIp: { type: String },
  userAgent: { type: String },
  revokedAt: { type: Date },
  revokedByIp: { type: String },
  replacedByTokenHash: { type: String }
});

refreshTokenSchema.methods.isExpired = function () {
  return Date.now() >= this.expiresAt.getTime();
};

refreshTokenSchema.methods.isActive = function () {
  return !this.revokedAt && !this.isExpired();
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);

