const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Location = require('../models/Location');
const AuthIdentity = require('../models/AuthIdentity');
const OAuthLogin = require('../models/OAuthLogin');

const adminCredentials = {
    email: 'admin@example.com',
    password: 'admin',
};

let server;
let baseUrl;
const createdEmails = new Set();
const createdLocationIds = new Set();
const createdIdentityIds = new Set();
const createdOAuthLoginIds = new Set();

async function request(path, options = {}) {
    return fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { 'content-type': 'application/json' } : {}),
            ...(options.headers || {}),
        },
    });
}

async function json(response) {
    return response.json();
}

test.before(async () => {
    await connectDB();
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.afterEach(async () => {
    await Promise.all([
        ...Array.from(createdEmails, (email) => User.deleteOne({ email })),
        ...Array.from(createdLocationIds, (id) => Location.deleteOne({ _id: id })),
        ...Array.from(createdIdentityIds, (id) => AuthIdentity.deleteOne({ _id: id })),
        ...Array.from(createdOAuthLoginIds, (id) => OAuthLogin.deleteOne({ _id: id })),
    ]);
    createdEmails.clear();
    createdLocationIds.clear();
    createdIdentityIds.clear();
    createdOAuthLoginIds.clear();
});

test.after(async () => {
    if (server) {
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
    await mongoose.disconnect();
});

test('admin can log in with the seeded admin account', async () => {
    const response = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(adminCredentials),
    });
    const body = await json(response);

    assert.equal(response.status, 200);
    assert.equal(body.user.role, 'admin');
    assert.equal(typeof body.token, 'string');
});

test('a user can register, log in successfully, and restore their session', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `auth-success-${suffix}@example.com`;
    createdEmails.add(email);

    const registration = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: `auth-success-${suffix}`, email, password: 'StrongPass123' }),
    });
    assert.equal(registration.status, 201);

    const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'StrongPass123' }),
    });
    const loginBody = await json(login);
    assert.equal(login.status, 200);
    assert.equal(loginBody.user.emailVerified, false);

    const me = await request('/api/auth/me', {
        headers: { authorization: `Bearer ${loginBody.token}` },
    });
    assert.equal(me.status, 200);
    assert.equal((await json(me)).user.id, loginBody.user.id);
});

test('duplicate email and username accounts are rejected', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `duplicate-${suffix}@example.com`;
    const username = `duplicate-${suffix}`;
    createdEmails.add(email);

    const first = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password: 'StrongPass123' }),
    });
    assert.equal(first.status, 201);

    const duplicateEmail = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: `${username}-other`, email, password: 'StrongPass123' }),
    });
    assert.equal(duplicateEmail.status, 400);
    assert.match((await json(duplicateEmail)).message, /already exists/i);

    const duplicateUsername = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email: `other-${suffix}@example.com`, password: 'StrongPass123' }),
    });
    assert.equal(duplicateUsername.status, 400);
    assert.match((await json(duplicateUsername)).message, /already exists/i);
    createdEmails.add(`other-${suffix}@example.com`);
});

test('authenticated users can restore their session and log out', async () => {
    const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(adminCredentials),
    });
    const loginBody = await json(login);
    assert.equal(login.status, 200);

    const me = await request('/api/auth/me', {
        headers: { authorization: `Bearer ${loginBody.token}` },
    });
    const meBody = await json(me);
    assert.equal(me.status, 200);
    assert.equal(meBody.user.role, 'admin');
    assert.equal(typeof meBody.user.username, 'string');

    const logout = await request('/api/auth/logout', {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
    });
    assert.equal(logout.status, 200);

    const unauthenticatedLogout = await request('/api/auth/logout', { method: 'POST' });
    assert.equal(unauthenticatedLogout.status, 401);
});

test('authenticated users can refresh a session token', async () => {
    const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(adminCredentials),
    });
    const loginBody = await json(login);

    const refresh = await request('/api/auth/refresh', {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
    });
    const refreshBody = await json(refresh);

    assert.equal(refresh.status, 200);
    assert.equal(typeof refreshBody.token, 'string');
    assert.notEqual(refreshBody.token, loginBody.token);
    assert.equal(refreshBody.user.role, 'admin');
});

test('OAuth callbacks reject missing or mismatched state without exchanging a provider code', async () => {
    const missingState = await request('/api/auth/oauth/google/callback?code=provider-code', {
        redirect: 'manual',
    });
    assert.equal(missingState.status, 302);
    assert.match(missingState.headers.get('location'), /oauthError=invalid_state/);

    const mismatchedState = jwt.sign({ provider: 'facebook' }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const invalidProvider = await request(
        `/api/auth/oauth/google/callback?code=provider-code&state=${mismatchedState}`,
        {
            redirect: 'manual',
            headers: { cookie: `oauth_state_google=${encodeURIComponent(mismatchedState)}` },
        },
    );
    assert.equal(invalidProvider.status, 302);
    assert.match(invalidProvider.headers.get('location'), /oauthError=invalid_provider/);
});

test('OAuth callback links an existing account and OAuth exchange is one-time', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `oauth-link-${suffix}@example.com`;
    createdEmails.add(email);

    const registration = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: `oauth-link-${suffix}`, email, password: 'StrongPass123' }),
    });
    assert.equal(registration.status, 201);

    const state = jwt.sign({ provider: 'google', nonce: suffix }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
        if (String(url).startsWith(baseUrl)) return originalFetch(url, options);
        if (String(url).includes('oauth2.googleapis.com/token')) {
            return new Response(JSON.stringify({ access_token: 'provider-access-token' }), { status: 200 });
        }
        return new Response(
            JSON.stringify({ sub: `google-sub-${suffix}`, email, email_verified: true, name: `OAuth Link ${suffix}` }),
            { status: 200 },
        );
    };

    try {
        const callback = await request(
            '/api/auth/oauth/google/callback?code=provider-code&state=' + encodeURIComponent(state),
            {
                redirect: 'manual',
                headers: { cookie: `oauth_state_google=${encodeURIComponent(state)}` },
            },
        );
        assert.equal(callback.status, 302);
        const location = new URL(callback.headers.get('location'));
        const handoffCode = location.searchParams.get('oauthCode');
        assert.match(handoffCode, /^[a-f0-9]{64}$/);

        const identity = await AuthIdentity.findOne({ provider: 'google', providerSubject: `google-sub-${suffix}` });
        assert.ok(identity);
        assert.equal(String(identity.userId), String((await User.findOne({ email }))._id));
        createdIdentityIds.add(identity._id);
        const handoff = await OAuthLogin.findOne({ userId: identity.userId }).sort({ createdAt: -1 });
        assert.ok(handoff);
        createdOAuthLoginIds.add(handoff._id);

        const exchange = await request('/api/auth/oauth/exchange', {
            method: 'POST',
            body: JSON.stringify({ code: handoffCode }),
        });
        const exchangeBody = await json(exchange);
        assert.equal(exchange.status, 200);
        assert.equal(exchangeBody.user.username, `oauth-link-${suffix}`);

        const replay = await request('/api/auth/oauth/exchange', {
            method: 'POST',
            body: JSON.stringify({ code: handoffCode }),
        });
        assert.equal(replay.status, 401);
    } finally {
        global.fetch = originalFetch;
    }
});

test('OAuth callback redirects to an error when provider token exchange fails', async () => {
    const state = jwt.sign({ provider: 'google' }, process.env.JWT_SECRET, { expiresIn: '10m' });
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
        if (String(url).startsWith(baseUrl)) return originalFetch(url, options);
        return new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 });
    };

    try {
        const response = await request(
            '/api/auth/oauth/google/callback?code=invalid-code&state=' + encodeURIComponent(state),
            {
                redirect: 'manual',
                headers: { cookie: `oauth_state_google=${encodeURIComponent(state)}` },
            },
        );
        assert.equal(response.status, 500);
    } finally {
        global.fetch = originalFetch;
    }
});

test('authentication and admin authorization boundaries reject missing, invalid, and regular-user access', async () => {
    const unauthenticatedMe = await request('/api/auth/me');
    assert.equal(unauthenticatedMe.status, 401);

    const invalidRefresh = await request('/api/auth/refresh', {
        method: 'POST',
        headers: { authorization: 'Bearer invalid-token' },
    });
    assert.equal(invalidRefresh.status, 401);

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `boundary-${suffix}@example.com`;
    createdEmails.add(email);
    await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: `boundary-${suffix}`, email, password: 'StrongPass123' }),
    });
    const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'StrongPass123' }),
    });
    const loginBody = await json(login);

    const invite = await request('/api/auth/invite-admin', {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify({ email: `invited-${suffix}@example.com` }),
    });
    assert.equal(invite.status, 403);
});

test('registration cannot create an admin by submitting a role', async () => {
    const email = `security-${Date.now()}@example.com`;
    createdEmails.add(email);

    const response = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            username: `security-${Date.now()}`,
            email,
            password: 'StrongPass123',
            role: 'admin',
        }),
    });

    assert.equal(response.status, 400);
    assert.equal(await User.exists({ email }), null);
});

test('invalid credentials are rejected', async () => {
    const response = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: adminCredentials.email,
            password: 'definitely-not-the-password',
        }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await json(response), { message: 'Invalid credentials' });
});

test('email verification completes when a valid verification token is submitted', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `verify-${suffix}@example.com`;
    createdEmails.add(email);

    const registration = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            username: `verify-${suffix}`,
            email,
            password: 'StrongPass123',
        }),
    });
    assert.equal(registration.status, 201);

    const requestResponse = await request('/api/auth/request-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
    const requestBody = await json(requestResponse);
    assert.equal(requestResponse.status, 200);
    assert.ok(requestBody.verificationToken || requestBody.message);

    const verifyResponse = await request('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: requestBody.verificationToken }),
    });
    assert.equal(verifyResponse.status, 200);

    const updatedUser = await User.findOne({ email }).lean();
    assert.equal(updatedUser.emailVerified, true);
    assert.equal(updatedUser.emailVerificationToken, null);
    assert.equal(updatedUser.emailVerificationExpiresAt, null);
});

test('password reset allows a user to log in with a new password', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `reset-${suffix}@example.com`;
    createdEmails.add(email);

    const registration = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            username: `reset-${suffix}`,
            email,
            password: 'StrongPass123',
        }),
    });
    assert.equal(registration.status, 201);

    const requestResponse = await request('/api/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
    const requestBody = await json(requestResponse);
    assert.equal(requestResponse.status, 200);
    assert.ok(requestBody.resetToken || requestBody.message);

    const resetResponse = await request('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
            token: requestBody.resetToken,
            password: 'NewStrongPass456',
        }),
    });
    assert.equal(resetResponse.status, 200);

    const loginResponse = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'NewStrongPass456' }),
    });
    assert.equal(loginResponse.status, 200);
    assert.equal((await json(loginResponse)).user.username, `reset-${suffix}`);
});

test('forged admin tokens cannot create locations', async () => {
    const before = await Location.countDocuments();
    const response = await request('/api/locations', {
        method: 'POST',
        headers: { authorization: 'Bearer forged-admin-token' },
        body: JSON.stringify({ name: 'Should Not Exist', address: 'Nowhere' }),
    });

    assert.equal(response.status, 401);
    assert.equal(await Location.countDocuments(), before);
});

test('a regular user cannot create locations', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `regular-${suffix}@example.com`;
    createdEmails.add(email);

    const registration = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            username: `regular-${suffix}`,
            email,
            password: 'StrongPass123',
        }),
    });
    assert.equal(registration.status, 201);

    const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'StrongPass123' }),
    });
    const loginBody = await json(login);
    assert.equal(login.status, 200);

    const response = await request('/api/locations', {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify({ name: 'Should Not Exist', address: 'Nowhere' }),
    });

    assert.equal(response.status, 403);
    assert.equal(await Location.exists({ name: 'Should Not Exist' }), null);
});

test('admin can create and delete a location', async () => {
    const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(adminCredentials),
    });
    const loginBody = await json(login);
    assert.equal(login.status, 200);

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const name = `Integration Court ${suffix}`;
    const createResponse = await request('/api/locations', {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify({
            name,
            address: '123 Test Street',
            coordinates: { type: 'Point', coordinates: [-73.9857, 40.7484] },
        }),
    });
    const created = await json(createResponse);
    if (created._id) {
        createdLocationIds.add(created._id);
    }

    assert.equal(createResponse.status, 201);
    assert.equal(created.name, name);

    try {
        const deleteResponse = await request(`/api/locations/${created._id}`, {
            method: 'DELETE',
            headers: { authorization: `Bearer ${loginBody.token}` },
        });

        assert.equal(deleteResponse.status, 200);
        assert.equal(await Location.exists({ _id: created._id }), null);
    } finally {
        await Location.deleteOne({ _id: created._id });
        createdLocationIds.delete(created._id);
    }
});
