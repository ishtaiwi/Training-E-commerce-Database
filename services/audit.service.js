const AuditLog = require('../models/AuditLog');
const { logger } = require('../utils/logger');

class AuditService {
  async record(action, { actor, target, metadata, ip, userAgent } = {}) {
    try {
      await AuditLog.create({
        action,
        actor: actor ? {
          id: actor.id || actor._id || null,
          email: actor.email || null,
          role: actor.role || null
        } : undefined,
        target: target ? {
          type: target.type || null,
          id: target.id || null,
          name: target.name || null
        } : undefined,
        metadata,
        ip,
        userAgent
      });
    } catch (err) {
      logger.warn('Failed to record audit log', {
        action,
        error: err.message
      });
    }
  }
}

module.exports = new AuditService();

