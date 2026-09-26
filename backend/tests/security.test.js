const test = require('node:test');
const assert = require('node:assert/strict');

const { validateRegistrationInput, validateLoginInput, validateGameInput } = require('../utils/validation');

test('registration rejects user-controlled admin privilege escalation', () => {
    assert.throws(
        () =>
            validateRegistrationInput({
                username: 'alice',
                email: 'alice@example.com',
                password: 'StrongPass123',
                role: 'admin',
            }),
        /admin role/i,
    );
});

test('registration rejects malformed input', () => {
    assert.throws(
        () => validateRegistrationInput({ username: '', email: 'user@example.com', password: 'StrongPass123' }),
        /Username must be between 3 and 50 characters/,
    );

    assert.throws(
        () => validateRegistrationInput({ username: 'alice', email: 'bad-email', password: 'StrongPass123' }),
        /Email is not valid/,
    );

    assert.throws(
        () => validateRegistrationInput({ username: 'alice', email: 'alice@example.com', password: 'short' }),
        /uppercase letter and one number/,
    );
});

test('login requires valid credentials shape', () => {
    assert.throws(
        () => validateLoginInput({ email: 'alice@example.com', password: '' }),
        /Password must be between 1 and 128 characters/,
    );
});

test('game validation rejects invalid schedule, capacity, and coordinates', () => {
    assert.throws(
        () =>
            validateGameInput({
                title: 'Test game',
                date: '2026-10-10',
                time: '25:00',
                location: '123 Volleyball Street',
                skillLevel: 'All Levels',
                totalSpots: 12,
                type: 'casual',
                courtType: 'indoor',
                coordinates: {
                    type: 'Point',
                    coordinates: [200, 90],
                },
            }),
        /time/i,
    );

    assert.throws(
        () =>
            validateGameInput({
                title: 'Test game',
                date: '2026-10-10',
                time: '18:00',
                location: '123 Volleyball Street',
                skillLevel: 'All Levels',
                totalSpots: 12,
                type: 'casual',
                courtType: 'indoor',
                coordinates: { type: 'Point', coordinates: [200, 90] },
            }),
        /coordinates/i,
    );
});
