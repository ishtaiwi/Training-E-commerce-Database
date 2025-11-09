const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, index: true },
  actor: {
    id: { type: String },
    email: { type: String },
    role: { type: String }
  },
  target: {
    type: { type: String },
    id: { type: String },
    name: { type: String }
  },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

auditLogSchema.index({ 'actor.id': 1, createdAt: -1 });
auditLogSchema.index({ 'target.id': 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

