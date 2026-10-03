const Game = require('../models/Game');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const User = require('../models/User');
const UserFollow = require('../models/UserFollow');

async function createNotification({ recipientId, actorId = null, eventKey, ...data }) {
    if (actorId && String(actorId) === String(recipientId)) return null;

    try {
        return await Notification.findOneAndUpdate(
            { eventKey },
            { $setOnInsert: { recipientId, actorId, eventKey, ...data } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
    } catch (error) {
        if (error.code === 11000) return null;
        throw error;
    }
}

async function ensureGameEndedNotifications(userId) {
    const games = await Game.find({ participants: userId, endsAt: { $lte: new Date() } })
        .select('_id title participants')
        .lean();

    await Promise.all(
        games.map((game) =>
            createNotification({
                recipientId: userId,
                type: 'game-ended',
                title: 'Game ended',
                message: `${game.title} has ended.`,
                entityType: 'game',
                entityId: String(game._id),
                eventKey: `game-ended:${game._id}:${userId}`,
            }),
        ),
    );
}

async function notifyFollow({ followerId, followedId }) {
    if (String(followerId) === String(followedId)) return;
    const [follower, profile] = await Promise.all([
        User.findById(followerId).select('_id username'),
        Profile.findOne({ userId: followerId }).select('displayName'),
    ]);
    if (!follower) return;

    const followerName = profile?.displayName || follower.username;
    await createNotification({
        recipientId: followedId,
        actorId: followerId,
        type: 'follow',
        title: 'New follower',
        message: `${followerName} started following you.`,
        entityType: 'profile',
        entityId: String(followerId),
        eventKey: `follow:${followerId}:${followedId}:${Date.now()}`,
    });
}

async function notifyGameJoin({ game, userId }) {
    const creatorId = String(game.createdBy?._id || game.createdBy);
    const [user, profile, followEdges] = await Promise.all([
        User.findById(userId).select('_id username'),
        Profile.findOne({ userId }).select('displayName'),
        UserFollow.find({ followedId: userId }).select('followerId'),
    ]);
    if (!user) return;
    const playerName = profile?.displayName || user.username;
    const participantRecipients = new Set(
        (game.participants || []).map((participant) => String(participant._id || participant)),
    );
    participantRecipients.delete(String(userId));
    participantRecipients.add(creatorId);
    const followerRecipients = new Set(followEdges.map((edge) => String(edge.followerId)));
    followerRecipients.delete(String(userId));
    const recipients = new Set([...participantRecipients, ...followerRecipients]);

    await Promise.all(
        [...recipients].map((recipientId) => {
            const isGameParticipant = participantRecipients.has(recipientId);
            return createNotification({
                recipientId,
                actorId: userId,
                type: isGameParticipant ? 'game-player-joined' : 'followed-user-joined-game',
                title: isGameParticipant ? 'A player joined your game' : 'Someone you follow joined a game',
                message: `${playerName} joined ${game.title}.`,
                entityType: 'game',
                entityId: String(game._id),
                eventKey: `game-joined:${game._id}:${userId}:${recipientId}:${Date.now()}`,
            });
        }),
    );
}

async function notifyGameDeleted({ game, actorId }) {
    if (game.endsAt <= new Date()) return;
    const recipients = new Set((game.participants || []).map((participant) => String(participant._id || participant)));
    recipients.delete(String(actorId));
    if (!recipients.size) return;

    const actor = await User.findById(actorId).select('_id username');
    const actorProfile = await Profile.findOne({ userId: actorId }).select('displayName');
    const actorName = actorProfile?.displayName || actor?.username || 'An admin';
    await Promise.all(
        [...recipients].map((recipientId) =>
            createNotification({
                recipientId,
                actorId,
                type: 'game-deleted',
                title: 'Game cancelled',
                message: `${actorName} deleted ${game.title} before it started.`,
                entityType: 'game',
                entityId: String(game._id),
                eventKey: `game-deleted:${game._id}:${recipientId}`,
            }),
        ),
    );
}

async function notifyGameRequestProcessed({ actionRequest, adminId, status }) {
    const requesterId = String(actionRequest.requestedBy?._id || actionRequest.requestedBy);
    if (requesterId === String(adminId)) return;
    const gameTitle = actionRequest.proposedGame?.title || 'your game';
    const approved = status === 'approved';
    await createNotification({
        recipientId: requesterId,
        actorId: adminId,
        type: approved ? 'game-request-approved' : 'game-request-declined',
        title: approved ? 'Game request approved' : 'Game request declined',
        message: approved
            ? `Your request for ${gameTitle} was approved.`
            : `Your request for ${gameTitle} was declined${actionRequest.reviewNote ? `: ${actionRequest.reviewNote}` : '.'}`,
        entityType: 'game-action-request',
        entityId: String(actionRequest._id),
        eventKey: `game-request-${status}:${actionRequest._id}`,
    });
}

module.exports = {
    createNotification,
    ensureGameEndedNotifications,
    notifyFollow,
    notifyGameJoin,
    notifyGameDeleted,
    notifyGameRequestProcessed,
};
