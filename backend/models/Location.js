const mongoose = require('mongoose');

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/; // Matches HH:MM in 24-hour format

const daySchema = {
    open: {
        type: String,
        validate: {
            validator: function (v) {
                return v === null || timeRegex.test(v);
            },
            message: (props) => `${props.value} is not a valid time! Use HH:MM (24-hour).`,
        },
    },
    close: {
        type: String,
        validate: {
            validator: function (v) {
                return v === null || timeRegex.test(v);
            },
            message: (props) => `${props.value} is not a valid time! Use HH:MM (24-hour).`,
        },
    },
};

const operatingHoursSchema = new mongoose.Schema({
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema,
    // Optional: handle exceptions/holidays
    exceptions: [
        {
            date: Date, // or String like "2026-01-01"
            open: String,
            close: String,
            note: String, // e.g., "Closed for holiday"
        },
    ],
});

const occupancySchema = new mongoose.Schema({
    // Simple approach: average or peak levels
    usualPeakHours: [String], // e.g., ["18:00-21:00"]
    averagePlayersPerHour: Number, // or more detailed
    notes: String, // e.g., "Very crowded on weekends"
    // Or more structured if needed:
    byDay: {
        monday: { low: Number, high: Number }, // e.g., expected min/max players
        // ... repeat for other days
    },
});

const locationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
        type: { type: String, default: 'Point' },
        coordinates: [Number], // [longitude, latitude]
    },
    // Geo index for nearby searches
    // mongoose will handle: locationSchema.index({ coordinates: '2dsphere' });

    description: String,
    photos: [String], // URLs
    amenities: [String], // e.g., ["indoor", "showers", "parking"]

    operatingHours: operatingHoursSchema,
    usualOccupancy: occupancySchema,

    // Other fields...
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Location', locationSchema);
