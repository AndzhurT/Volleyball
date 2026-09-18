// routes/locations.js
const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { protect, admin } = require('../middleware/auth');
const { validateLocationInput } = require('../utils/validation');

router.get('/', async (req, res) => {
    try {
        const locations = await Location.find();
        res.json(locations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);
        if (!location) return res.status(404).json({ message: 'Location not found' });
        res.json(location);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', protect, admin, async (req, res) => {
    try {
        const locationData = validateLocationInput(req.body);
        const newLocation = await Location.create(locationData);
        res.status(201).json(newLocation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', protect, admin, async (req, res) => {
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
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
