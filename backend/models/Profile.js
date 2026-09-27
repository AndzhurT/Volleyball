const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        displayName: { type: String, required: true, trim: true, maxlength: 80 },
        avatar: { type: String, trim: true, maxlength: 2048, default: '' },
        bio: { type: String, trim: true, maxlength: 500, default: '' },
        location: { type: String, trim: true, maxlength: 120, default: '' },
        skillLevel: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
            default: 'All Levels',
        },
        positions: { type: [String], default: [] },
    },
    { timestamps: true },
);

profileSchema.statics.ensureForUser = function (user) {
    return this.findOneAndUpdate(
        { userId: user._id },
        { $setOnInsert: { displayName: user.username } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    );
};

module.exports = mongoose.model('Profile', profileSchema);
