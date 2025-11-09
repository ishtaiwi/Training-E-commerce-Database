const userService = require('../services/user.service');
const auditService = require('../services/audit.service');

function buildAuditContext(req) {
  return {
    actor: req.user ? {
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role
    } : undefined,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
}

exports.listUsers = async (req, res, next) => {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.sub);
    res.json(user);
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const existingUser = await userService.getUserById(req.params.id);
    const user = await userService.updateUserRole(req.params.id, role);

    await auditService.record('user.role.updated', {
      ...buildAuditContext(req),
      target: {
        type: 'User',
        id: user.id,
        name: user.name
      },
      metadata: {
        previousRole: existingUser.role,
        newRole: user.role
      }
    });

    res.json(user);
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};
