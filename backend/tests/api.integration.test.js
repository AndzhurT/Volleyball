const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const app = require('../index');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Location = require('../models/Location');

const adminCredentials = {
    email: 'admin@example.com',
    password: 'admin',
};

let server;
let baseUrl;
const createdEmails = new Set();
const createdLocationIds = new Set();

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
    ]);
    createdEmails.clear();
    createdLocationIds.clear();
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
