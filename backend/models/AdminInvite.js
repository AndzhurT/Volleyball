// models/AdminInvite.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const adminInviteSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  token: { type: String, required: true, unique: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

adminInviteSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('AdminInvite', adminInviteSchema);