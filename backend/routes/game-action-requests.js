const express = require('express');
const mongoose = require('mongoose');
const Game = require('../models/Game');
const GameActionRequest = require('../models/GameActionRequest');
const { protect, admin } = require('../middleware/auth');
const { validateGameInput } = require('../utils/validation');

const router = express.Router();

function validId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

async function populateRequest(request) {
    return request.populate([
        { path: 'requestedBy', select: '_id username email' },
        { path: 'reviewedBy', select: '_id username' },
    ]);
}

router.post('/', protect, async (req, res, next) => {
    try {
        const { action, gameId } = req.body || {};
        if (!['create', 'update'].includes(action)) {
            return res.status(400).json({ message: 'Action must be create or update' });
        }

        const proposedGame = validateGameInput(req.body.game);
        let game = null;

        if (action === 'create') {
            if (gameId !== undefined)
                return res.status(400).json({ message: 'Create requests cannot include a game ID' });
        } else {
            if (typeof gameId !== 'string' || !validId(gameId)) {
                return res.status(400).json({ message: 'A valid game ID is required for update requests' });
            }
            game = await Game.findById(gameId);
            if (!game) return res.status(404).json({ message: 'Game not found' });
            if (String(game.createdBy) !== String(req.user.id)) {
                return res.status(403).json({ message: 'Only the game creator can request updates' });
            }
        }

        const actionRequest = await GameActionRequest.create({
            action,
            requestedBy: req.user.id,
            game: game?._id || null,
            proposedGame,
        });
        await populateRequest(actionRequest);
        res.status(201).json(actionRequest);
    } catch (err) {
        next(err);
    }
});

router.get('/mine', protect, async (req, res, next) => {
    try {
        const requests = await GameActionRequest.find({ requestedBy: req.user.id })
            .populate('reviewedBy', '_id username')
            .sort({ createdAt: -1 });
        res.json({ data: requests });
    } catch (err) {
        next(err);
    }
});

router.get('/', protect, admin, async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
        const filter = {};
        if (['pending', 'processing', 'approved', 'declined'].includes(req.query.status)) {
            filter.status = req.query.status;
        }

        const [requests, total] = await Promise.all([
            GameActionRequest.find(filter)
                .populate('requestedBy', '_id username email')
                .populate('reviewedBy', '_id username')
                .sort({ createdAt: 1 })
                .skip((page - 1) * limit)
                .limit(limit),
            GameActionRequest.countDocuments(filter),
        ]);

        res.json({ page, limit, total, totalPages: Math.ceil(total / limit), data: requests });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', protect, admin, async (req, res, next) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid action request ID' });
        const actionRequest = await GameActionRequest.findById(req.params.id)
            .populate('requestedBy', '_id username email')
            .populate('reviewedBy', '_id username');
        if (!actionRequest) return res.status(404).json({ message: 'Action request not found' });
        res.json(actionRequest);
    } catch (err) {
        next(err);
    }
});

router.post('/:id/approve', protect, admin, async (req, res, next) => {
    let actionRequest;
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid action request ID' });
        const reviewNote = typeof req.body?.reviewNote === 'string' ? req.body.reviewNote.trim() : '';
        if (reviewNote.length > 1000) return res.status(400).json({ message: 'Review note is too long' });

        actionRequest = await GameActionRequest.findOneAndUpdate(
            { _id: req.params.id, status: 'pending' },
            { $set: { status: 'processing', reviewedBy: req.user.id, reviewedAt: new Date(), reviewNote } },
            { new: true },
        );
        if (!actionRequest) {
            const exists = await GameActionRequest.exists({ _id: req.params.id });
            return res.status(exists ? 409 : 404).json({
                message: exists ? 'Action request has already been reviewed' : 'Action request not found',
            });
        }

        let game;
        if (actionRequest.action === 'create') {
            game = await Game.create({
                ...actionRequest.proposedGame,
                createdBy: actionRequest.requestedBy,
                participants: [actionRequest.requestedBy],
            });
            actionRequest.game = game._id;
        } else {
            game = await Game.findOneAndUpdate(
                { _id: actionRequest.game, createdBy: actionRequest.requestedBy },
                { $set: actionRequest.proposedGame },
                { new: true, runValidators: true },
            );
            if (!game) {
                const error = new Error('The requested game no longer exists or is not owned by the requester');
                error.statusCode = 409;
                throw error;
            }
        }

        actionRequest.status = 'approved';
        await actionRequest.save();
        await populateRequest(actionRequest);
        res.json({ request: actionRequest, game });
    } catch (err) {
        if (actionRequest?._id) {
            await GameActionRequest.updateOne(
                { _id: actionRequest._id, status: 'processing' },
                { $set: { status: 'pending', reviewedBy: null, reviewedAt: null, reviewNote: '' } },
            );
        }
        next(err);
    }
});

router.post('/:id/decline', protect, admin, async (req, res, next) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid action request ID' });
        const reviewNote = typeof req.body?.reviewNote === 'string' ? req.body.reviewNote.trim() : '';
        if (reviewNote.length > 1000) return res.status(400).json({ message: 'Review note is too long' });

        const actionRequest = await GameActionRequest.findOneAndUpdate(
            { _id: req.params.id, status: 'pending' },
            {
                $set: {
                    status: 'declined',
                    reviewedBy: req.user.id,
                    reviewedAt: new Date(),
                    reviewNote,
                },
            },
            { new: true },
        );
        if (!actionRequest) {
            const exists = await GameActionRequest.exists({ _id: req.params.id });
            return res.status(exists ? 409 : 404).json({
                message: exists ? 'Action request has already been reviewed' : 'Action request not found',
            });
        }

        await populateRequest(actionRequest);
        res.json(actionRequest);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
