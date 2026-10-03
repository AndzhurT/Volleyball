const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        type: {
            type: String,
            enum: [
                'follow',
                'followed-user-joined-game',
                'game-player-joined',
                'game-deleted',
                'game-ended',
                'game-request-approved',
                'game-request-declined',
            ],
            required: true,
        },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        message: { type: String, required: true, trim: true, maxlength: 500 },
        entityType: { type: String, enum: ['profile', 'game', 'game-action-request'], required: true },
        entityId: { type: String, required: true },
        eventKey: { type: String, required: true, unique: true },
        readAt: { type: Date, default: null },
    },
    { timestamps: true },
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
