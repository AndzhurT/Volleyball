const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 3000,
            connectTimeoutMS: 3000,
            socketTimeoutMS: 45000,
            family: 4,
            autoIndex: true,
        });

        isConnected = true;
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        isConnected = false;
        console.error('MongoDB connection error:', err.message);

        // Retry silently in background
        setTimeout(connectDB, 5000);
    }
};

mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('MongoDB disconnected — retrying...');
});

mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error('MongoDB error:', err.message);
});

const getDBStatus = () => isConnected;

module.exports = { connectDB, getDBStatus };
