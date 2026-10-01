const mongoose = require('mongoose');

const playerReviewSchema = new mongoose.Schema(
    {
        profileUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reviewerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String, trim: true, maxlength: 1000, default: '' },
    },
    { timestamps: true },
);

playerReviewSchema.index({ profileUserId: 1, reviewerUserId: 1 }, { unique: true });
playerReviewSchema.index({ profileUserId: 1, createdAt: -1 });

module.exports = mongoose.model('PlayerReview', playerReviewSchema);
