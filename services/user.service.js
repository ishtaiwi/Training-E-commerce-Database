const User = require('../models/User');

class UserService {
  async listUsers() {
    const users = await User.find({}, '-passwordHash');
    return users;
  }

  async getUserById(id) {
    const user = await User.findById(id, '-passwordHash');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUserRole(id, role) {
    const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }).select('-passwordHash');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

module.exports = new UserService();
