// routes/locations.js
const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { protect, admin } = require('../middleware/auth');
const { validateLocationInput } = require('../utils/validation');

router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const [locations, total] = await Promise.all([
            Location.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            Location.countDocuments(),
        ]);

        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: locations,
        });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const location = await Location.findById(req.params.id);
        if (!location) return res.status(404).json({ message: 'Location not found' });
        res.json(location);
    } catch (err) {
        next(err);
    }
});

router.post('/', protect, admin, async (req, res, next) => {
    try {
        const locationData = validateLocationInput(req.body);
        const newLocation = await Location.create(locationData);
        res.status(201).json(newLocation);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', protect, admin, async (req, res, next) => {
    try {
        const location = await Location.findById(req.params.id);

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        await Location.findByIdAndDelete(req.params.id);

        res.json({ message: 'Location deleted successfully' });
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid location ID format' });
        }
        next(err);
    }
});

module.exports = router;
