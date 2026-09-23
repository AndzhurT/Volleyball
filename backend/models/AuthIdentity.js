const mongoose = require('mongoose');

const authIdentitySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        provider: { type: String, enum: ['google', 'facebook'], required: true },
        providerSubject: { type: String, required: true },
        providerEmail: { type: String, lowercase: true, trim: true },
    },
    { timestamps: true },
);

authIdentitySchema.index({ provider: 1, providerSubject: 1 }, { unique: true });
authIdentitySchema.index({ userId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('AuthIdentity', authIdentitySchema);
