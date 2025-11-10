const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Editor', 'Viewer'], default: 'Viewer', index: true },
  createdAt: { type: Date, default: Date.now },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  providerId: { type: String },
  emailVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date }
});

userSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = mongoose.model('User', userSchema);




