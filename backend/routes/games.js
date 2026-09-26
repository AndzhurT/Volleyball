const express = require('express');
const mongoose = require('mongoose');
const Game = require('../models/Game');
const { protect, admin, optionalProtect } = require('../middleware/auth');
const { validateGameInput } = require('../utils/validation');

const router = express.Router();

function serializeGame(game, includeLocation) {
    const value = game.toObject ? game.toObject() : game;
    const participants = value.participants || [];
    const result = {
        id: String(value._id),
        title: value.title,
        date: value.date,
        time: value.time,
        description: value.description,
        skillLevel: value.skillLevel,
        totalSpots: value.totalSpots,
        spotsLeft: Math.max(0, value.totalSpots - participants.length),
        type: value.type,
        courtType: value.courtType,
        createdBy: value.createdBy?._id ? String(value.createdBy._id) : String(value.createdBy),
        playersJoined: participants.map((participant) => ({
            id: String(participant._id || participant),
            name: participant.username || 'Player',
            avatar: '',
        })),
        createdAt: value.createdAt,
        updatedAt: value.updatedAt,
    };

    if (includeLocation) {
        result.location = value.location;
        if (value.coordinates?.coordinates?.length === 2) result.coordinates = value.coordinates;
    }

    return result;
}

function validId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

router.get('/', optionalProtect, async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
        const filter = {};

        if (typeof req.query.skillLevel === 'string') filter.skillLevel = req.query.skillLevel;
        if (typeof req.query.type === 'string') filter.type = req.query.type;
        if (typeof req.query.courtType === 'string') filter.courtType = req.query.courtType;
        if (typeof req.query.date === 'string') filter.date = req.query.date;

        const [games, total] = await Promise.all([
            Game.find(filter)
                .populate('createdBy', '_id username')
                .populate('participants', '_id username')
                .sort({ date: 1, time: 1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Game.countDocuments(filter),
        ]);

        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: games.map((game) => serializeGame(game, !!req.user)),
        });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', optionalProtect, async (req, res, next) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid game ID' });
        const game = await Game.findById(req.params.id)
            .populate('createdBy', '_id username')
            .populate('participants', '_id username');
        if (!game) return res.status(404).json({ message: 'Game not found' });
        res.json(serializeGame(game, !!req.user));
    } catch (err) {
        next(err);
    }
});

router.post('/', protect, admin, async (req, res, next) => {
    try {
        const gameData = validateGameInput(req.body);
        const game = await Game.create({
            ...gameData,
            createdBy: req.user.id,
            participants: [req.user.id],
        });
        await game.populate(['createdBy', 'participants']);
        res.status(201).json(serializeGame(game, true));
    } catch (err) {
        next(err);
    }
});

router.put('/:id', protect, admin, async (req, res, next) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid game ID' });
        const gameData = validateGameInput(req.body);
        const game = await Game.findByIdAndUpdate(
            req.params.id,
            { $set: gameData },
            { new: true, runValidators: true },
        ).populate('createdBy participants', '_id username');
        if (!game) return res.status(404).json({ message: 'Game not found' });
        res.json(serializeGame(game, true));
    } catch (err) {
        next(err);
    }
});

router.post('/:id/join', protect, async (req, res, next) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid game ID' });
        const result = await Game.updateOne(
            {
                _id: req.params.id,
                participants: { $ne: req.user.id },
                $expr: { $lt: [{ $size: '$participants' }, '$totalSpots'] },
            },
            { $addToSet: { participants: req.user.id } },
        );

        if (!result.modifiedCount) {
            const game = await Game.findById(req.params.id);
            if (!game) return res.status(404).json({ message: 'Game not found' });
            if (game.participants.some((id) => String(id) === String(req.user.id))) {
                return res.status(409).json({ message: 'You already joined this game' });
            }
            return res.status(409).json({ message: 'This game is full' });
        }

        const game = await Game.findById(req.params.id).populate('createdBy participants', '_id username');
        res.json(serializeGame(game, true));
    } catch (err) {
        next(err);
    }
});

router.delete('/:id/participants/me', protect, async (req, res, next) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid game ID' });
        const game = await Game.findByIdAndUpdate(
            req.params.id,
            { $pull: { participants: req.user.id } },
            { new: true },
        ).populate('createdBy participants', '_id username');
        if (!game) return res.status(404).json({ message: 'Game not found' });
        res.json(serializeGame(game, true));
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', protect, async (req, res, next) => {
    try {
        if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid game ID' });
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ message: 'Game not found' });
        if (String(game.createdBy) !== String(req.user.id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only the game creator or an admin can delete this game' });
        }
        await game.deleteOne();
        res.json({ message: 'Game deleted successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
