const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { ensureGameEndedNotifications } = require('../utils/notifications');

const router = express.Router();

function serializeNotification(notification) {
    return {
        id: String(notification._id),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actor: notification.actorId
            ? {
                  id: String(notification.actorId._id || notification.actorId),
                  username: notification.actorId.username || '',
              }
            : null,
        entityType: notification.entityType,
        entityId: notification.entityId,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
    };
}

router.get('/unread-count', protect, async (req, res, next) => {
    try {
        await ensureGameEndedNotifications(req.user.id);
        const count = await Notification.countDocuments({ recipientId: req.user.id, readAt: null });
        res.json({ count });
    } catch (err) {
        next(err);
    }
});

router.get('/', protect, async (req, res, next) => {
    try {
        await ensureGameEndedNotifications(req.user.id);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
        const notifications = await Notification.find({ recipientId: req.user.id })
            .populate('actorId', '_id username')
            .sort({ createdAt: -1 })
            .limit(limit);
        const unreadCount = await Notification.countDocuments({ recipientId: req.user.id, readAt: null });
        res.json({ data: notifications.map(serializeNotification), unreadCount });
    } catch (err) {
        next(err);
    }
});

router.put('/read-all', protect, async (req, res, next) => {
    try {
        await Notification.updateMany({ recipientId: req.user.id, readAt: null }, { $set: { readAt: new Date() } });
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        next(err);
    }
});

router.put('/:id/read', protect, async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid notification ID' });
        }
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientId: req.user.id },
            { $set: { readAt: new Date() } },
            { new: true },
        ).populate('actorId', '_id username');
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json({ notification: serializeNotification(notification) });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
