const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');
const User = require('../models/User');
const AdminInvite = require('../models/AdminInvite');
const AuthIdentity = require('../models/AuthIdentity');
const OAuthLogin = require('../models/OAuthLogin');
const { protect, admin } = require('../middleware/auth');
const { validateRegistrationInput, validateLoginInput } = require('../utils/validation');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not set in environment variables');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const providers = {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },
    facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        redirectUri: process.env.FACEBOOK_REDIRECT_URI,
    },
};

function getProviderConfig(provider) {
    const config = providers[provider];
    if (!config || !config.clientId || !config.clientSecret || !config.redirectUri) {
        const error = new Error(`${provider} login is not configured`);
        error.statusCode = 503;
        throw error;
    }
    return config;
}

function readCookie(req, name) {
    const header = req.headers.cookie || '';
    const entry = header
        .split(';')
        .map((value) => value.trim())
        .find((value) => value.startsWith(`${name}=`));
    return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

function setStateCookie(res, provider, value) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
        'Set-Cookie',
        `oauth_state_${provider}=${encodeURIComponent(value)}; Max-Age=600; HttpOnly; SameSite=Lax; Path=/api/auth${secure}`,
    );
}

function clearStateCookie(res, provider) {
    res.append('Set-Cookie', `oauth_state_${provider}=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/api/auth`);
}

function createSessionToken(user) {
    return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function hashCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
}

async function exchangeProviderCode(provider, code, config) {
    const params = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
    });
    const tokenUrl =
        provider === 'google'
            ? 'https://oauth2.googleapis.com/token'
            : 'https://graph.facebook.com/v20.0/oauth/access_token';
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
    });
    const body = await response.json();
    if (!response.ok || !body.access_token) throw new Error('OAuth token exchange failed');
    return body.access_token;
}

async function fetchProviderProfile(provider, accessToken) {
    const profileUrl =
        provider === 'google'
            ? `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(accessToken)}`
            : `https://graph.facebook.com/v20.0/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(profileUrl);
    const body = await response.json();
    if (!response.ok || (!body.id && !body.sub)) throw new Error('OAuth profile lookup failed');

    const subject = provider === 'google' ? body.sub : body.id;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
    if (!email) throw new Error('This provider did not return an email address');
    if (provider === 'google' && body.email_verified !== true) throw new Error('Google email is not verified');

    return { subject, email, name: body.name || email.split('@')[0] };
}

async function createOAuthUser(profile) {
    const baseUsername =
        profile.name
            .trim()
            .replace(/[^a-zA-Z0-9_]+/g, '')
            .slice(0, 40) ||
        profile.email
            .split('@')[0]
            .replace(/[^a-zA-Z0-9_]+/g, '')
            .slice(0, 40) ||
        'player';
    let username = baseUsername;
    let suffix = 1;
    while (await User.exists({ username })) {
        username = `${baseUsername.slice(0, 44)}${suffix}`;
        suffix += 1;
    }
    return User.create({ username, email: profile.email });
}

router.get('/oauth/:provider', (req, res, next) => {
    try {
        const { provider } = req.params;
        const config = getProviderConfig(provider);
        const nonce = crypto.randomBytes(24).toString('hex');
        const state = jwt.sign({ provider, nonce }, JWT_SECRET, { expiresIn: '10m' });
        setStateCookie(res, provider, state);

        const authorizationUrl =
            provider === 'google'
                ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
                : new URL('https://www.facebook.com/v20.0/dialog/oauth');
        authorizationUrl.search = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            response_type: 'code',
            scope: provider === 'google' ? 'openid email profile' : 'email,public_profile',
            state,
        }).toString();
        res.redirect(authorizationUrl.toString());
    } catch (err) {
        next(err);
    }
});

router.get('/oauth/:provider/callback', async (req, res, next) => {
    const { provider } = req.params;
    try {
        const config = getProviderConfig(provider);
        const state = typeof req.query.state === 'string' ? req.query.state : null;
        const code = typeof req.query.code === 'string' ? req.query.code : null;
        const storedState = readCookie(req, `oauth_state_${provider}`);
        if (!state || !code || !storedState || state !== storedState) {
            return res.redirect(`${FRONTEND_URL}/?oauthError=invalid_state`);
        }

        const decoded = jwt.verify(state, JWT_SECRET);
        if (decoded.provider !== provider) return res.redirect(`${FRONTEND_URL}/?oauthError=invalid_provider`);

        const accessToken = await exchangeProviderCode(provider, code, config);
        const profile = await fetchProviderProfile(provider, accessToken);
        let identity = await AuthIdentity.findOne({ provider, providerSubject: profile.subject });
        let user;

        if (identity) {
            user = await User.findById(identity.userId);
            if (!user) return res.redirect(`${FRONTEND_URL}/?oauthError=account_not_found`);
        } else {
            const existingUser = await User.findOne({ email: profile.email });
            if (existingUser) {
                identity = await AuthIdentity.create({
                    userId: existingUser._id,
                    provider,
                    providerSubject: profile.subject,
                    providerEmail: profile.email,
                });
                user = existingUser;
            } else {
                user = await createOAuthUser(profile);
                identity = await AuthIdentity.create({
                    userId: user._id,
                    provider,
                    providerSubject: profile.subject,
                    providerEmail: profile.email,
                });
            }
        }

        const handoffCode = crypto.randomBytes(32).toString('hex');
        await OAuthLogin.createCode(hashCode(handoffCode), user._id);
        clearStateCookie(res, provider);
        res.redirect(`${FRONTEND_URL}/?oauthCode=${encodeURIComponent(handoffCode)}`);
    } catch (err) {
        next(err);
    }
});

router.post('/oauth/exchange', async (req, res, next) => {
    try {
        const code = typeof req.body.code === 'string' ? req.body.code : '';
        if (!/^[a-f0-9]{64}$/.test(code)) return res.status(400).json({ message: 'Invalid OAuth code' });

        const handoff = await OAuthLogin.findOneAndUpdate(
            { codeHash: hashCode(code), consumedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
            { $set: { consumedAt: new Date() } },
            { new: true },
        ).populate('userId', '_id username role');
        if (!handoff || !handoff.userId) return res.status(401).json({ message: 'OAuth code is invalid or expired' });

        const user = handoff.userId;
        res.json({ token: createSessionToken(user), user: { id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        next(err);
    }
});

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
