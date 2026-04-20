// index.js
const express = require('express');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies (required for login, register, and POST locations)
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Volleyball API!');
});

// Mount your routes
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/locations');

app.use('/api/auth', authRoutes); // → Login: /api/auth/login
app.use('/api/locations', locationRoutes); // → Locations: /api/locations

// Connect to MongoDB
connectDB();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
