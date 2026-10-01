const mongoose = require('mongoose');

const userFollowSchema = new mongoose.Schema(
    {
        followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        followedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true },
);

userFollowSchema.index({ followerId: 1, followedId: 1 }, { unique: true });
userFollowSchema.index({ followedId: 1, createdAt: -1 });
userFollowSchema.index({ followerId: 1, createdAt: -1 });

module.exports = mongoose.model('UserFollow', userFollowSchema);
