const mongoose = require('mongoose');

const oauthLoginSchema = new mongoose.Schema(
    {
        codeHash: { type: String, required: true, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        expiresAt: { type: Date, required: true },
        consumedAt: { type: Date },
    },
    { timestamps: true },
);

oauthLoginSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

oauthLoginSchema.statics.createCode = function (codeHash, userId) {
    return this.create({
        codeHash,
        userId,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    });
};

module.exports = mongoose.model('OAuthLogin', oauthLoginSchema);
