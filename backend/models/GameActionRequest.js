const mongoose = require('mongoose');

const gameActionRequestSchema = new mongoose.Schema(
    {
        action: { type: String, enum: ['create', 'update'], required: true },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', default: null },
        proposedGame: { type: mongoose.Schema.Types.Mixed, required: true },
        status: {
            type: String,
            enum: ['pending', 'processing', 'approved', 'declined'],
            default: 'pending',
            required: true,
        },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedAt: { type: Date, default: null },
        reviewNote: { type: String, trim: true, maxlength: 1000, default: '' },
    },
    { timestamps: true },
);

gameActionRequestSchema.index({ status: 1, createdAt: 1 });
gameActionRequestSchema.index({ requestedBy: 1, createdAt: -1 });

module.exports = mongoose.model('GameActionRequest', gameActionRequestSchema);
