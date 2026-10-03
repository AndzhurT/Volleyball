const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');
const UserFollow = require('../models/UserFollow');
const { protect, optionalProtect } = require('../middleware/auth');
const { validateProfileInput } = require('../utils/validation');

const router = express.Router();

function serializePerson(user, profile, isFollowing = false) {
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
        isFollowing,
    };
}

async function loadConnections(userId, viewerId) {
    const [followerEdges, followingEdges] = await Promise.all([
        UserFollow.find({ followedId: userId }).select('followerId'),
        UserFollow.find({ followerId: userId }).select('followedId'),
    ]);
    const followerIds = followerEdges.map((edge) => edge.followerId);
    const followingIds = followingEdges.map((edge) => edge.followedId);
    const userIds = [...new Set([...followerIds, ...followingIds].map(String))];
    if (!userIds.length) return { followers: [], following: [] };

    const [users, profiles, viewerFollows] = await Promise.all([
        User.find({ _id: { $in: userIds } }).select('_id username createdAt'),
        Profile.find({ userId: { $in: userIds } }),
        viewerId
            ? UserFollow.find({ followerId: viewerId, followedId: { $in: userIds } }).select('followedId')
            : Promise.resolve([]),
    ]);
    const profileByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));
    const userById = new Map(users.map((user) => [String(user._id), user]));
    const viewerFollowingIds = new Set(viewerFollows.map((follow) => String(follow.followedId)));
    const serializeIds = (ids) =>
        ids.flatMap((id) => {
            const user = userById.get(String(id));
            const profile = profileByUserId.get(String(id));
            return user && profile ? [serializePerson(user, profile, viewerFollowingIds.has(String(id)))] : [];
        });

    return { followers: serializeIds(followerIds), following: serializeIds(followingIds) };
}

function serializeProfile(user, profile, connections = { followers: [], following: [] }, isFollowing = false) {
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
        gamesAttended: [],
        followers: connections.followers,
        following: connections.following,
        isFollowing,
        stats: {
            winRate: 0,
            hoursPlayed: 0,
            favoritePosition: profile.positions[0] || '',
            memberSince: user.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        },
    };
}

async function findUserProfile(userId, viewerId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const user = await User.findById(userId).select('_id username createdAt');
    if (!user) return null;
    const profile = await Profile.ensureForUser(user);
    const [connections, follow] = await Promise.all([
        loadConnections(user._id, viewerId),
        viewerId && String(viewerId) !== String(user._id)
            ? UserFollow.exists({ followerId: viewerId, followedId: user._id })
            : null,
    ]);
    return serializeProfile(user, profile, connections, !!follow);
}

router.get('/', optionalProtect, async (req, res, next) => {
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
        const follows = req.user
            ? await UserFollow.find({
                  followerId: req.user.id,
                  followedId: { $in: users.map((user) => user._id) },
              }).select('followedId')
            : [];
        const followingIds = new Set(follows.map((follow) => String(follow.followedId)));
        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: users.map((user, index) =>
                serializeProfile(
                    user,
                    profiles[index],
                    { followers: [], following: [] },
                    followingIds.has(String(user._id)),
                ),
            ),
        });
    } catch (err) {
        next(err);
    }
});

router.get('/me', protect, async (req, res, next) => {
    try {
        const profile = await findUserProfile(req.user.id, req.user.id);
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

router.put('/:userId/follow', protect, async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user ID' });
        if (String(userId) === String(req.user.id))
            return res.status(400).json({ message: 'You cannot follow yourself' });
        if (!(await User.exists({ _id: userId }))) return res.status(404).json({ message: 'User not found' });

        await UserFollow.updateOne(
            { followerId: req.user.id, followedId: userId },
            { $setOnInsert: { followerId: req.user.id, followedId: userId } },
            { upsert: true },
        );
        res.json({ isFollowing: true });
    } catch (err) {
        if (err.code === 11000) return res.json({ isFollowing: true });
        next(err);
    }
});

router.delete('/:userId/follow', protect, async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user ID' });
        await UserFollow.deleteOne({ followerId: req.user.id, followedId: userId });
        res.json({ isFollowing: false });
    } catch (err) {
        next(err);
    }
});

async function listConnections(req, res, next, connectionType) {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user ID' });
        const user = await User.findById(userId).select('_id');
        if (!user) return res.status(404).json({ message: 'User not found' });
        const edgeFilter = connectionType === 'followers' ? { followedId: userId } : { followerId: userId };
        const idField = connectionType === 'followers' ? 'followerId' : 'followedId';
        const edges = await UserFollow.find(edgeFilter).select(idField).sort({ createdAt: -1 });
        const users = await User.find({ _id: { $in: edges.map((edge) => edge[idField]) } }).select(
            '_id username createdAt',
        );
        const profiles = await Profile.find({ userId: { $in: users.map((item) => item._id) } });
        const profileByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));
        const userById = new Map(users.map((item) => [String(item._id), item]));
        const data = edges.flatMap((edge) => {
            const id = String(edge[idField]);
            const connectionUser = userById.get(id);
            const profile = profileByUserId.get(id);
            return connectionUser && profile ? [serializePerson(connectionUser, profile)] : [];
        });
        res.json({ data });
    } catch (err) {
        next(err);
    }
}

router.get('/:userId/followers', (req, res, next) => listConnections(req, res, next, 'followers'));
router.get('/:userId/following', (req, res, next) => listConnections(req, res, next, 'following'));

router.get('/:userId', optionalProtect, async (req, res, next) => {
    try {
        const profile = await findUserProfile(req.params.userId, req.user?.id);
        if (!profile) return res.status(404).json({ message: 'User profile not found' });
        res.json({ profile });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
