const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 120 },
        date: { type: String, required: true },
        time: { type: String, required: true },
        location: { type: String, required: true, trim: true, maxlength: 255 },
        coordinates: {
            type: { type: String, enum: ['Point'], default: undefined },
            coordinates: { type: [Number], default: undefined, validate: (value) => !value || value.length === 2 },
        },
        description: { type: String, trim: true, maxlength: 2000, default: '' },
        skillLevel: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
            required: true,
        },
        totalSpots: { type: Number, min: 2, max: 100, required: true },
        type: { type: String, enum: ['casual', 'competitive'], required: true },
        courtType: { type: String, enum: ['indoor', 'outdoor', 'beach'], required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true },
);

gameSchema.virtual('spotsLeft').get(function () {
    const taken = Array.isArray(this.participants) ? this.participants.length : 0;
    return this.totalSpots - taken;
});

gameSchema.index({ date: 1, time: 1 });
gameSchema.index({ coordinates: '2dsphere' }, { sparse: true });
gameSchema.index({ title: 'text', location: 'text', description: 'text' });
gameSchema.set('toJSON', { virtuals: true });
gameSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Game', gameSchema);
