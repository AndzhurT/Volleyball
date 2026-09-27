const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { protect } = require('../middleware/auth');
const { validateProfileInput } = require('../utils/validation');

const router = express.Router();

function serializeProfile(user, profile) {
    return {
        id: String(user._id),
        username: user.username,
        displayName: profile.displayName || user.username,
        avatar: profile.avatar,
        bio: profile.bio,
        location: profile.location,
        skillLevel: profile.skillLevel,
        positions: profile.positions,
        gamesPlayed: 0,
        rating: 0,
        reviews: [],
        gamesAttended: [],
        followers: [],
        following: [],
        achievements: [],
        stats: {
            winRate: 0,
            hoursPlayed: 0,
            favoritePosition: profile.positions[0] || '',
            memberSince: user.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        },
    };
}

async function findUserProfile(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const user = await User.findById(userId).select('_id username createdAt');
    if (!user) return null;
    const profile = await Profile.ensureForUser(user);
    return serializeProfile(user, profile);
}

router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
        const [users, total] = await Promise.all([
            User.find()
                .select('_id username createdAt')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(),
        ]);
        const profiles = await Promise.all(users.map((user) => Profile.ensureForUser(user)));
        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: users.map((user, index) => serializeProfile(user, profiles[index])),
        });
    } catch (err) {
        next(err);
    }
});

router.get('/me', protect, async (req, res, next) => {
    try {
        const profile = await findUserProfile(req.user.id);
        if (!profile) return res.status(404).json({ message: 'User profile not found' });
        res.json({ profile });
    } catch (err) {
        next(err);
    }
});

router.put('/me', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('_id username createdAt');
        if (!user) return res.status(404).json({ message: 'User account not found' });
        const profileData = validateProfileInput(req.body);
        const profile = await Profile.findOneAndUpdate(
            { userId: user._id },
            { $set: profileData, $setOnInsert: { userId: user._id } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
        );
        res.json({ profile: serializeProfile(user, profile) });
    } catch (err) {
        next(err);
    }
});

router.get('/:userId', async (req, res, next) => {
    try {
        const profile = await findUserProfile(req.params.userId);
        if (!profile) return res.status(404).json({ message: 'User profile not found' });
        res.json({ profile });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
