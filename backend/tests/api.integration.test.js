const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Game = require('../models/Game');
const Profile = require('../models/Profile');
const UserFollow = require('../models/UserFollow');
const GameActionRequest = require('../models/GameActionRequest');
const Notification = require('../models/Notification');
const AuthIdentity = require('../models/AuthIdentity');
const OAuthLogin = require('../models/OAuthLogin');

const adminCredentials = {
    email: 'admin@example.com',
    password: 'admin',
};

let server;
let baseUrl;
const createdEmails = new Set();
const createdGameIds = new Set();
const createdActionRequestIds = new Set();
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
    const users = await User.find({ email: { $in: [...createdEmails] } }).select('_id');
    const userIds = users.map((user) => user._id);
    await Promise.all([
        ...Array.from(createdEmails, (email) => User.deleteOne({ email })),
        Profile.deleteMany({ userId: { $in: userIds } }),
        UserFollow.deleteMany({
            $or: [{ followerId: { $in: userIds } }, { followedId: { $in: userIds } }],
        }),
        Notification.deleteMany({ recipientId: { $in: userIds } }),
        ...Array.from(createdGameIds, (id) => Game.deleteOne({ _id: id })),
        ...Array.from(createdActionRequestIds, (id) => GameActionRequest.deleteOne({ _id: id })),
        ...Array.from(createdIdentityIds, (id) => AuthIdentity.deleteOne({ _id: id })),
        ...Array.from(createdOAuthLoginIds, (id) => OAuthLogin.deleteOne({ _id: id })),
    ]);
    createdEmails.clear();
    createdGameIds.clear();
    createdActionRequestIds.clear();
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

test('registration creates a private-editable public profile with safe defaults', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `profile-${suffix}@example.com`;
    createdEmails.add(email);

    const registration = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: `profile-${suffix}`, email, password: 'StrongPass123' }),
    });
    const registrationBody = await json(registration);
    assert.equal(registration.status, 201);
    const userId = registrationBody.user.id;

    const initialProfile = await request(`/api/profiles/${userId}`);
    const initialProfileBody = await json(initialProfile);
    assert.equal(initialProfile.status, 200);
    assert.equal(initialProfileBody.profile.username, `profile-${suffix}`);
    assert.equal(initialProfileBody.profile.displayName, `profile-${suffix}`);
    assert.equal(initialProfileBody.profile.skillLevel, 'All Levels');
    assert.deepEqual(initialProfileBody.profile.positions, []);
    assert.equal('requests' in initialProfileBody.profile, false);
    assert.equal('email' in initialProfileBody.profile, false);

    const unauthenticatedEdit = await request('/api/profiles/me', {
        method: 'PUT',
        body: JSON.stringify({ displayName: 'Unauthorized', skillLevel: 'Advanced', positions: [] }),
    });
    assert.equal(unauthenticatedEdit.status, 401);

    const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'StrongPass123' }),
    });
    const token = (await json(login)).token;
    const actionRequest = await request('/api/game-action-requests', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify({
            action: 'create',
            game: {
                title: `Private Game ${suffix}`,
                date: '2026-11-02',
                time: '18:00',
                location: '123 Private Court',
                skillLevel: 'Intermediate',
                totalSpots: 12,
                type: 'casual',
                courtType: 'indoor',
            },
        }),
    });
    const actionRequestBody = await json(actionRequest);
    assert.equal(actionRequest.status, 201);
    createdActionRequestIds.add(actionRequestBody._id);

    const edited = await request('/api/profiles/me', {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify({
            displayName: 'Profile Test Player',
            avatar: 'https://example.com/player.jpg',
            bio: 'Ready to play.',
            location: 'North District',
            skillLevel: 'Intermediate',
            positions: ['Setter', 'Libero'],
            requests: [{ private: 'must not persist' }],
        }),
    });
    const editedBody = await json(edited);
    assert.equal(edited.status, 200);
    assert.equal(editedBody.profile.displayName, 'Profile Test Player');
    assert.equal(editedBody.profile.location, 'North District');
    assert.equal('requests' in editedBody.profile, false);

    const publicProfile = await request(`/api/profiles/${userId}`);
    const publicProfileBody = await json(publicProfile);
    assert.equal(publicProfileBody.profile.skillLevel, 'Intermediate');
    assert.equal('requests' in publicProfileBody.profile, false);
    assert.equal('actionRequests' in publicProfileBody.profile, false);
    assert.equal('email' in publicProfileBody.profile, false);
    assert.equal(JSON.stringify(publicProfileBody).includes(actionRequestBody._id), false);
    const profiles = await request('/api/profiles');
    assert.ok((await json(profiles)).data.some((profile) => profile.id === userId));
});

test('users can follow and unfollow other profiles and see both relationship lists', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const followerEmail = `follower-${suffix}@example.com`;
    const followedEmail = `followed-${suffix}@example.com`;
    createdEmails.add(followerEmail);
    createdEmails.add(followedEmail);

    const followerRegistration = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: `follower-${suffix}`, email: followerEmail, password: 'StrongPass123' }),
    });
    const followedRegistration = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: `followed-${suffix}`, email: followedEmail, password: 'StrongPass123' }),
    });
    const followerId = (await json(followerRegistration)).user.id;
    const followedId = (await json(followedRegistration)).user.id;

    const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: followerEmail, password: 'StrongPass123' }),
    });
    const token = (await json(login)).token;

    const selfFollow = await request(`/api/profiles/${followerId}/follow`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(selfFollow.status, 400);

    const follow = await request(`/api/profiles/${followedId}/follow`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(follow.status, 200);
    assert.equal((await json(follow)).isFollowing, true);

    const followedProfile = await request(`/api/profiles/${followedId}`, {
        headers: { authorization: `Bearer ${token}` },
    });
    const followedProfileBody = (await json(followedProfile)).profile;
    assert.equal(followedProfileBody.isFollowing, true);
    assert.equal(followedProfileBody.followers[0].id, followerId);

    const followerProfile = await request(`/api/profiles/${followerId}`);
    const followerProfileBody = (await json(followerProfile)).profile;
    assert.equal(followerProfileBody.following[0].id, followedId);

    const ownProfile = await request(`/api/profiles/${followerId}`, {
        headers: { authorization: `Bearer ${token}` },
    });
    const ownProfileBody = (await json(ownProfile)).profile;
    assert.equal(ownProfileBody.following.find((person) => person.id === followedId).isFollowing, true);

    const unfollow = await request(`/api/profiles/${followedId}/follow`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(unfollow.status, 200);
    assert.equal((await json(unfollow)).isFollowing, false);
    assert.equal(
        (
            await json(
                await request(`/api/profiles/${followedId}`, {
                    headers: { authorization: `Bearer ${token}` },
                }),
            )
        ).profile.followers.length,
        0,
    );
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

test('forged tokens cannot create games', async () => {
    const before = await Game.countDocuments();
    const response = await request('/api/games', {
        method: 'POST',
        headers: { authorization: 'Bearer forged-admin-token' },
        body: JSON.stringify({}),
    });

    assert.equal(response.status, 401);
    assert.equal(await Game.countDocuments(), before);
});

test('a user can request game creation and update, and only admins can approve', async () => {
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

    const proposedGame = {
        title: `Game ${suffix}`,
        date: '2026-10-10',
        time: '18:30',
        location: '123 Volleyball Way',
        coordinates: { type: 'Point', coordinates: [-73.9857, 40.7484] },
        skillLevel: 'Intermediate',
        totalSpots: 2,
        type: 'casual',
        courtType: 'indoor',
        description: 'Test game',
    };

    const directCreate = await request('/api/games', {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify(proposedGame),
    });
    assert.equal(directCreate.status, 403);
    assert.equal(await Game.countDocuments({ title: proposedGame.title }), 0);

    const createRequestResponse = await request('/api/game-action-requests', {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify({ action: 'create', game: proposedGame }),
    });
    const createRequest = await json(createRequestResponse);
    if (createRequest._id) createdActionRequestIds.add(createRequest._id);
    assert.equal(createRequestResponse.status, 201);
    assert.equal(createRequest.status, 'pending');

    const pendingEdit = { ...proposedGame, title: `Pending Edit ${suffix}` };
    const pendingEditResponse = await request(`/api/game-action-requests/${createRequest._id}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify({ game: pendingEdit }),
    });
    assert.equal(pendingEditResponse.status, 200);
    assert.equal((await json(pendingEditResponse)).proposedGame.title, pendingEdit.title);

    const disposableRequestResponse = await request('/api/game-action-requests', {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify({ action: 'create', game: { ...proposedGame, title: `Delete Pending ${suffix}` } }),
    });
    const disposableRequest = await json(disposableRequestResponse);
    createdActionRequestIds.add(disposableRequest._id);

    const myRequests = await request('/api/game-action-requests/mine', {
        headers: { authorization: `Bearer ${loginBody.token}` },
    });
    assert.ok((await json(myRequests)).data.some((item) => item._id === createRequest._id));

    const userQueue = await request('/api/game-action-requests');
    assert.equal(userQueue.status, 401);
    const regularQueue = await request('/api/game-action-requests', {
        headers: { authorization: `Bearer ${loginBody.token}` },
    });
    assert.equal(regularQueue.status, 403);
    const adminLogin = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(adminCredentials),
    });
    const adminToken = (await json(adminLogin)).token;
    const nonOwnerEdit = await request(`/api/game-action-requests/${createRequest._id}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ game: proposedGame }),
    });
    assert.equal(nonOwnerEdit.status, 404);
    const nonOwnerDelete = await request(`/api/game-action-requests/${disposableRequest._id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(nonOwnerDelete.status, 404);
    const deletePending = await request(`/api/game-action-requests/${disposableRequest._id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${loginBody.token}` },
    });
    assert.equal(deletePending.status, 200);
    createdActionRequestIds.delete(disposableRequest._id);

    const adminQueue = await request('/api/game-action-requests?status=pending', {
        headers: { authorization: `Bearer ${adminToken}` },
    });
    const queueBody = await json(adminQueue);
    assert.equal(adminQueue.status, 200);
    assert.ok(queueBody.data.some((item) => item._id === createRequest._id));
    const adminDetail = await request(`/api/game-action-requests/${createRequest._id}`, {
        headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminDetail.status, 200);

    const forbiddenApproval = await request(`/api/game-action-requests/${createRequest._id}/approve`, {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
    });
    assert.equal(forbiddenApproval.status, 403);

    const approval = await request(`/api/game-action-requests/${createRequest._id}/approve`, {
        method: 'POST',
        headers: { authorization: `Bearer ${adminToken}` },
    });
    const approvalBody = await json(approval);
    assert.equal(approval.status, 200);
    assert.equal(approvalBody.request.status, 'approved');
    const created = approvalBody.game;
    createdGameIds.add(created.id);
    assert.equal(created.createdBy, createRequest.requestedBy._id || createRequest.requestedBy);
    assert.equal(created.title, pendingEdit.title);
    assert.equal(created.location, '123 Volleyball Way');
    assert.equal(created.spotsLeft, 1);
    assert.equal(created.durationMinutes, 90);
    assert.equal(created.lifecycleStatus, 'upcoming');

    const duplicateApproval = await request(`/api/game-action-requests/${createRequest._id}/approve`, {
        method: 'POST',
        headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(duplicateApproval.status, 409);
    assert.equal(await Game.countDocuments({ title: pendingEdit.title }), 1);
    const reviewedUpdate = await request(`/api/game-action-requests/${createRequest._id}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify({ game: proposedGame }),
    });
    assert.equal(reviewedUpdate.status, 409);
    const reviewedDelete = await request(`/api/game-action-requests/${createRequest._id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${loginBody.token}` },
    });
    assert.equal(reviewedDelete.status, 409);

    const anonymousRead = await request(`/api/games/${created.id}`);
    const anonymousBody = await json(anonymousRead);
    assert.equal(anonymousRead.status, 200);
    assert.equal('location' in anonymousBody, false);
    assert.equal('coordinates' in anonymousBody, false);

    const anonymousList = await request('/api/games');
    const listedGame = (await json(anonymousList)).data.find((game) => game.id === created.id);
    assert.ok(listedGame);
    assert.equal('location' in listedGame, false);
    assert.equal('coordinates' in listedGame, false);

    const authenticatedRead = await request(`/api/games/${created.id}`, {
        headers: { authorization: `Bearer ${loginBody.token}` },
    });
    assert.equal((await json(authenticatedRead)).location, '123 Volleyball Way');

    const proposedUpdate = { ...proposedGame, title: `Updated Game ${suffix}` };
    const directUpdate = await request(`/api/games/${created.id}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify(proposedUpdate),
    });
    assert.equal(directUpdate.status, 403);

    const updateRequestResponse = await request('/api/game-action-requests', {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify({ action: 'update', gameId: created.id, game: proposedUpdate }),
    });
    const updateRequest = await json(updateRequestResponse);
    createdActionRequestIds.add(updateRequest._id);
    assert.equal(updateRequestResponse.status, 201);

    const updateApproval = await request(`/api/game-action-requests/${updateRequest._id}/approve`, {
        method: 'POST',
        headers: { authorization: `Bearer ${adminToken}` },
    });
    const updateApprovalBody = await json(updateApproval);
    assert.equal(updateApproval.status, 200);
    assert.equal(updateApprovalBody.game.title, `Updated Game ${suffix}`);
    assert.equal(updateApprovalBody.request.status, 'approved');

    const declinedRequestResponse = await request('/api/game-action-requests', {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify({
            action: 'update',
            gameId: created.id,
            game: { ...proposedUpdate, title: `Declined Game ${suffix}` },
        }),
    });
    const declinedRequest = await json(declinedRequestResponse);
    createdActionRequestIds.add(declinedRequest._id);
    const decline = await request(`/api/game-action-requests/${declinedRequest._id}/decline`, {
        method: 'POST',
        headers: { authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ reviewNote: 'Please provide more detail.' }),
    });
    const declineBody = await json(decline);
    assert.equal(decline.status, 200);
    assert.equal(declineBody.status, 'declined');
    assert.equal(declineBody.reviewNote, 'Please provide more detail.');
    assert.equal((await Game.findById(created.id)).title, `Updated Game ${suffix}`);

    const secondEmail = `join-${suffix}@example.com`;
    createdEmails.add(secondEmail);
    const secondRegistration = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: `join-${suffix}`, email: secondEmail, password: 'StrongPass123' }),
    });
    assert.equal(secondRegistration.status, 201);
    const secondLogin = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: secondEmail, password: 'StrongPass123' }),
    });
    const secondLoginBody = await json(secondLogin);

    const nonOwnerUpdateRequest = await request('/api/game-action-requests', {
        method: 'POST',
        headers: { authorization: `Bearer ${secondLoginBody.token}` },
        body: JSON.stringify({ action: 'update', gameId: created.id, game: proposedGame }),
    });
    assert.equal(nonOwnerUpdateRequest.status, 403);

    const join = await request(`/api/games/${created.id}/join`, {
        method: 'POST',
        headers: { authorization: `Bearer ${secondLoginBody.token}` },
    });
    assert.equal(join.status, 200);
    assert.equal((await json(join)).spotsLeft, 0);

    const myGames = await request('/api/games/mine', {
        headers: { authorization: `Bearer ${secondLoginBody.token}` },
    });
    const myGamesBody = await json(myGames);
    assert.equal(myGames.status, 200);
    assert.ok(myGamesBody.data.some((game) => game.id === created.id));

    const fullJoin = await request(`/api/games/${created.id}/join`, {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
    });
    assert.equal(fullJoin.status, 409);

    const ownerDelete = await request(`/api/games/${created.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${loginBody.token}` },
    });
    assert.equal(ownerDelete.status, 200);
    createdGameIds.delete(created.id);
});

test('admins can create and update games directly while non-owners cannot delete them', async () => {
    const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(adminCredentials),
    });
    const loginBody = await json(login);
    assert.equal(login.status, 200);

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const createResponse = await request('/api/games', {
        method: 'POST',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify({
            title: `Owned Game ${suffix}`,
            date: '2026-10-11',
            time: '19:00',
            location: '123 Test Street',
            coordinates: { type: 'Point', coordinates: [-73.9857, 40.7484] },
            skillLevel: 'All Levels',
            totalSpots: 12,
            durationMinutes: 30,
            type: 'casual',
            courtType: 'outdoor',
        }),
    });
    const created = await json(createResponse);
    if (created.id) createdGameIds.add(created.id);

    assert.equal(createResponse.status, 201);
    assert.equal(created.title, `Owned Game ${suffix}`);

    const updateResponse = await request(`/api/games/${created.id}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${loginBody.token}` },
        body: JSON.stringify({
            title: `Admin Updated ${suffix}`,
            date: '2026-10-12',
            time: '20:00',
            location: '456 Admin Street',
            skillLevel: 'Advanced',
            totalSpots: 10,
            type: 'competitive',
            courtType: 'indoor',
        }),
    });
    assert.equal(updateResponse.status, 200);
    assert.equal((await json(updateResponse)).title, `Admin Updated ${suffix}`);

    const userEmail = `non-owner-${suffix}@example.com`;
    createdEmails.add(userEmail);
    await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: `non-owner-${suffix}`, email: userEmail, password: 'StrongPass123' }),
    });
    const userLogin = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: userEmail, password: 'StrongPass123' }),
    });
    const userToken = (await json(userLogin)).token;
    const forbiddenDelete = await request(`/api/games/${created.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${userToken}` },
    });
    assert.equal(forbiddenDelete.status, 403);

    try {
        const deleteResponse = await request(`/api/games/${created.id}`, {
            method: 'DELETE',
            headers: { authorization: `Bearer ${loginBody.token}` },
        });

        assert.equal(deleteResponse.status, 200);
        assert.equal(await Game.exists({ _id: created.id }), null);
    } finally {
        await Game.deleteOne({ _id: created.id });
        createdGameIds.delete(created.id);
    }
});

test('users cannot join games whose duration has already ended', async () => {
    const adminLogin = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(adminCredentials),
    });
    const adminToken = (await json(adminLogin)).token;
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `ended-game-${suffix}@example.com`;
    createdEmails.add(email);

    await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: `ended-${suffix}`, email, password: 'StrongPass123' }),
    });
    const userLogin = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'StrongPass123' }),
    });
    const userToken = (await json(userLogin)).token;

    const startsAt = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const date = startsAt.toISOString().slice(0, 10);
    const time = startsAt.toISOString().slice(11, 16);
    const gameResponse = await request('/api/games', {
        method: 'POST',
        headers: { authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
            title: `Ended Game ${suffix}`,
            date,
            time,
            location: '123 Past Game Avenue',
            skillLevel: 'All Levels',
            totalSpots: 10,
            durationMinutes: 60,
            type: 'casual',
            courtType: 'outdoor',
        }),
    });
    const game = await json(gameResponse);
    assert.equal(gameResponse.status, 201);
    createdGameIds.add(game.id);
    assert.equal(game.lifecycleStatus, 'ended');

    const join = await request(`/api/games/${game.id}/join`, {
        method: 'POST',
        headers: { authorization: `Bearer ${userToken}` },
    });
    assert.equal(join.status, 409);
    assert.match((await json(join)).message, /ended/i);
});

test('configured frontend origins can preflight API requests but other origins are rejected', async () => {
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
    const allowed = await request('/api/game-action-requests', {
        method: 'OPTIONS',
        headers: {
            origin: allowedOrigin,
            'access-control-request-method': 'GET',
            'access-control-request-headers': 'authorization',
        },
    });
    assert.equal(allowed.status, 204);
    assert.equal(allowed.headers.get('access-control-allow-origin'), allowedOrigin);

    const rejected = await request('/api/game-action-requests', {
        method: 'OPTIONS',
        headers: { origin: 'https://untrusted.example' },
    });
    assert.equal(rejected.status, 403);
});

test('following a user creates a follow notification for the followed user', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email1 = `follow-notif-1-${suffix}@example.com`;
    const email2 = `follow-notif-2-${suffix}@example.com`;
    createdEmails.add(email1);
    createdEmails.add(email2);

    const user1 = await User.create({
        username: `follow-notif-1-${suffix}`,
        email: email1,
        role: 'user',
    });
    const user2 = await User.create({
        username: `follow-notif-2-${suffix}`,
        email: email2,
        role: 'user',
    });

    await Profile.create({ userId: user1._id, displayName: 'User One' });
    await Profile.create({ userId: user2._id, displayName: 'User Two' });

    const token2 = jwt.sign({ id: user2._id, role: user2.role }, process.env.JWT_SECRET);

    // user2 follows user1
    const res = await request(`/api/profiles/${user1._id}/follow`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${token2}` },
    });
    assert.ok([200, 201].includes(res.status), `unexpected status ${res.status}`);

    const notifs = await Notification.find({ recipientId: user1._id });
    assert.equal(notifs.length, 1);
    assert.equal(notifs[0].type, 'follow'); // adjust if your type is different
    assert.equal(String(notifs[0].actorId), String(user2._id));
    assert.equal(notifs[0].readAt, null);
});

test('GET /api/notifications returns notifications and unread count', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `notif-list-${suffix}@example.com`;
    createdEmails.add(email);

    const user = await User.create({
        username: `notif-list-${suffix}`,
        email,
        role: 'user',
    });
    await Profile.create({ userId: user._id, displayName: 'List User' });

    await Notification.create([
        {
            recipientId: user._id,
            type: 'follow',
            title: 'New follower',
            message: 'Someone followed you',
            actorId: user._id,
            entityType: 'profile',
            entityId: String(user._id),
            eventKey: `follow:${user._id}:${user._id}`,
        },
        {
            recipientId: user._id,
            type: 'game-ended',
            title: 'Game ended',
            message: 'Your game has ended',
            readAt: new Date(),
            entityType: 'game',
            entityId: new mongoose.Types.ObjectId().toString(),
            eventKey: `game-ended:${user._id}:${Date.now()}`,
        },
    ]);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    const res = await request('/api/notifications', {
        headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);

    const body = await json(res);
    assert.ok(Array.isArray(body.data));
    assert.equal(body.data.length, 2);
    assert.equal(body.unreadCount, 1);

    const first = body.data[0];
    assert.ok(first.id);
    assert.ok(first.type);
    assert.ok('title' in first);
    assert.ok('message' in first);
    assert.ok('readAt' in first);
    assert.ok('createdAt' in first);
});

test('GET /api/notifications/unread-count returns the correct count', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `notif-count-${suffix}@example.com`;
    createdEmails.add(email);

    const user = await User.create({
        username: `notif-count-${suffix}`,
        email,
        role: 'user',
    });
    await Profile.create({ userId: user._id, displayName: 'Count User' });

    await Notification.create([
        {
            recipientId: user._id,
            type: 'follow',
            title: 'A',
            message: 'a',
            entityType: 'profile',
            entityId: String(user._id),
            eventKey: `follow-a:${user._id}`,
        },
        {
            recipientId: user._id,
            type: 'follow',
            title: 'B',
            message: 'b',
            entityType: 'profile',
            entityId: String(user._id),
            eventKey: `follow-b:${user._id}`,
        },
        {
            recipientId: user._id,
            type: 'follow',
            title: 'C',
            message: 'c',
            readAt: new Date(),
            entityType: 'profile',
            entityId: String(user._id),
            eventKey: `follow-c:${user._id}`,
        },
    ]);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    const res = await request('/api/notifications/unread-count', {
        headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);

    const body = await json(res);
    assert.equal(body.count, 2);
});

test('PUT /api/notifications/read-all marks all notifications as read', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `notif-readall-${suffix}@example.com`;
    createdEmails.add(email);

    const user = await User.create({
        username: `notif-readall-${suffix}`,
        email,
        role: 'user',
    });
    await Profile.create({ userId: user._id, displayName: 'ReadAll User' });

    await Notification.create([
        {
            recipientId: user._id,
            type: 'follow',
            title: 'A',
            message: 'a',
            entityType: 'profile',
            entityId: String(user._id),
            eventKey: `follow-a:${user._id}`,
        },
        {
            recipientId: user._id,
            type: 'follow',
            title: 'B',
            message: 'b',
            entityType: 'profile',
            entityId: String(user._id),
            eventKey: `follow-b:${user._id}`,
        },
    ]);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    const res = await request('/api/notifications/read-all', {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);

    const unread = await Notification.countDocuments({
        recipientId: user._id,
        readAt: null,
    });
    assert.equal(unread, 0);
});

test('PUT /api/notifications/:id/read marks a single notification as read', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `notif-readone-${suffix}@example.com`;
    createdEmails.add(email);

    const user = await User.create({
        username: `notif-readone-${suffix}`,
        email,
        role: 'user',
    });
    await Profile.create({ userId: user._id, displayName: 'ReadOne User' });

    const [notif] = await Notification.create([
        {
            recipientId: user._id,
            type: 'follow',
            title: 'A',
            message: 'a',
            entityType: 'profile',
            entityId: String(user._id),
            eventKey: `follow-one:${user._id}`,
        },
    ]);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    const res = await request(`/api/notifications/${notif._id}/read`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);

    const body = await json(res);
    assert.ok(body.notification);
    assert.ok(body.notification.readAt);

    const updated = await Notification.findById(notif._id);
    assert.ok(updated.readAt);
});

test("PUT /api/notifications/:id/read returns 404 for another user's notification", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email1 = `notif-owner-${suffix}@example.com`;
    const email2 = `notif-other-${suffix}@example.com`;
    createdEmails.add(email1);
    createdEmails.add(email2);

    const owner = await User.create({
        username: `notif-owner-${suffix}`,
        email: email1,
        role: 'user',
    });
    const other = await User.create({
        username: `notif-other-${suffix}`,
        email: email2,
        role: 'user',
    });

    await Profile.create({ userId: owner._id, displayName: 'Owner' });
    await Profile.create({ userId: other._id, displayName: 'Other' });

    const [notif] = await Notification.create([
        {
            recipientId: owner._id,
            type: 'follow',
            title: 'A',
            message: 'a',
            entityType: 'profile',
            entityId: String(owner._id),
            eventKey: `follow-owner:${owner._id}`,
        },
    ]);

    const tokenOther = jwt.sign({ id: other._id, role: other.role }, process.env.JWT_SECRET);

    const res = await request(`/api/notifications/${notif._id}/read`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${tokenOther}` },
    });
    assert.equal(res.status, 404);
});
