// routes/locations.js
const express = require('express');
const router = express.Router();
const Location = require('../models/Location'); // You'll create this model next
const { protect, admin } = require('../middleware/auth');

// GET all locations
router.get('/', async (req, res) => {
    try {
        const locations = await Location.find();
        res.json(locations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET single location by ID
router.get('/:id', async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);
        if (!location) return res.status(404).json({ message: 'Location not found' });
        res.json(location);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create new location (you can protect this later with auth)
router.post('/', protect, admin, async (req, res) => {
    const location = new Location(req.body);
    try {
        const newLocation = await location.save();
        res.status(201).json(newLocation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;

// DELETE a location by ID
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        // Option 1: Simple remove (Mongoose < 7)
        // await location.remove();

        // Option 2: Recommended for Mongoose 6+ and 7+
        await Location.findByIdAndDelete(req.params.id);

        res.json({ message: 'Location deleted successfully' });
    } catch (err) {
        // Handle invalid ID format (e.g., not a valid ObjectId)
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid location ID format' });
        }
        res.status(500).json({ message: err.message });
    }
});
