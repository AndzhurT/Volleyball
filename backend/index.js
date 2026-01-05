// index.js
const express = require('express');
const dotenv = require('dotenv');
const { connectDB, getDBStatus } = require('./config/db');

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

connectDB();

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        db: getDBStatus() ? 'connected' : 'connecting',
    });
});

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await mongoose.connection.close();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

app.get('/', (_req, res) => {
    res.send('Welcome to the Volleyball API!');
});
