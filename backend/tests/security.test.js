const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateRegistrationInput,
  validateLoginInput,
  validateLocationInput,
} = require('../utils/validation');

test('registration rejects user-controlled admin privilege escalation', () => {
  assert.throws(
    () => validateRegistrationInput({
      username: 'alice',
      email: 'alice@example.com',
      password: 'StrongPass123',
      role: 'admin',
    }),
    /admin role/i
  );
});

test('registration rejects malformed input', () => {
  assert.throws(
    () => validateRegistrationInput({ username: '', email: 'bad-email', password: 'short' }),
    /valid/i
  );
});

test('login requires valid credentials shape', () => {
  assert.throws(
    () => validateLoginInput({ email: 'bad-email', password: '' }),
    /valid/i
  );
});

test('location validation rejects invalid operating hours and coordinates', () => {
  assert.throws(
    () => validateLocationInput({
      name: 'Court',
      address: '123 Street',
      coordinates: {
        type: 'Point',
        coordinates: [200, 90],
      },
      operatingHours: {
        monday: { open: '99:00', close: '10:00' },
      },
    }),
    /longitude|hours|valid/i
  );
});
