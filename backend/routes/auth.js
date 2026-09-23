const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/User');
const AdminInvite = require('../models/AdminInvite');
const { protect, admin } = require('../middleware/auth');
const { validateRegistrationInput, validateLoginInput } = require('../utils/validation');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not set in environment variables');

router.post('/invite-admin', protect, admin, async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const token = AdminInvite.generateToken();
        const invite = await AdminInvite.create({
            email: email.toLowerCase().trim(),
            token,
            invitedBy: req.user.id,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            message: 'Admin invite created',
            email: invite.email,
            inviteToken: token,
            expiresAt: invite.expiresAt,
        });
    } catch (err) {
        next(err);
    }
});

router.post('/register', async (req, res, next) => {
    try {
        const { username, email, password } = validateRegistrationInput(req.body);
        const adminInviteToken =
            typeof req.body.adminInviteToken === 'string' ? req.body.adminInviteToken.trim() : null;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        let role = 'user';

        if (adminInviteToken) {
            const invite = await AdminInvite.findOne({
                email: email.toLowerCase(),
                token: adminInviteToken,
                used: false,
            });

            if (invite && invite.expiresAt > Date.now()) {
                role = 'admin';
                invite.used = true;
                await invite.save();
            }
        }

        const user = await User.create({ username, email, password, role });

        res.status(201).json({ message: 'User created', user: { id: user._id, role: user.role } });
    } catch (err) {
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = validateLoginInput(req.body);

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: { id: user._id, username: user.username, role: user.role },
        });
    } catch (err) {
        next(err);
    }
});

router.get('/me', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('_id username role');
        if (!user) return res.status(401).json({ message: 'User account not found' });

        res.json({
            user: { id: user._id, username: user.username, role: user.role },
        });
    } catch (err) {
        next(err);
    }
});

router.post('/logout', protect, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
