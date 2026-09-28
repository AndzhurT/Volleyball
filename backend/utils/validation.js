const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

function validationError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function ensureString(value, fieldName, { minLength = 1, maxLength = 200 } = {}) {
    if (typeof value !== 'string') {
        throw validationError(`${fieldName} must be a valid string.`);
    }

    const trimmed = value.trim();

    if (trimmed.length < minLength || trimmed.length > maxLength) {
        throw validationError(`${fieldName} must be between ${minLength} and ${maxLength} characters.`);
    }

    return trimmed;
}

function validateRegistrationInput(data = {}) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw validationError('Registration payload must be a valid object.');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'role')) {
        throw validationError('Admin role is not allowed during registration.');
    }

    const username = ensureString(data.username, 'Username', { minLength: 3, maxLength: 50 });
    const email = ensureString(data.email, 'Email', { minLength: 5, maxLength: 255 }).toLowerCase();
    const password = ensureString(data.password, 'Password', { minLength: 1, maxLength: 128 });

    if (!EMAIL_REGEX.test(email)) {
        throw validationError('Email is not valid.');
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        throw validationError('Password must contain at least one uppercase letter and one number.');
    }

    return { username, email, password };
}

function validateLoginInput(data = {}) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw validationError('Login payload must be a valid object.');
    }

    const email = ensureString(data.email, 'Email', { minLength: 5, maxLength: 255 }).toLowerCase();
    const password = ensureString(data.password, 'Password', { minLength: 1, maxLength: 128 });

    if (!EMAIL_REGEX.test(email)) {
        throw validationError('Email is not valid.');
    }

    return { email, password };
}

function validateProfileInput(data = {}) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw validationError('Profile payload must be a valid object.');
    }

    const displayName = ensureString(data.displayName, 'Display name', { minLength: 2, maxLength: 80 });
    for (const field of ['location', 'bio', 'avatar']) {
        if (data[field] !== undefined && typeof data[field] !== 'string') {
            throw validationError(`${field} must be a string.`);
        }
    }
    const location = typeof data.location === 'string' ? data.location.trim() : '';
    const bio = typeof data.bio === 'string' ? data.bio.trim() : '';
    const avatar = typeof data.avatar === 'string' ? data.avatar.trim() : '';
    if (location.length > 120) throw validationError('Location must be 120 characters or fewer.');
    if (bio.length > 500) throw validationError('Bio must be 500 characters or fewer.');
    if (avatar.length > 2048) throw validationError('Profile picture URL is too long.');
    if (avatar) {
        let parsedAvatar;
        try {
            parsedAvatar = new URL(avatar);
        } catch {
            throw validationError('Profile picture must be a valid HTTP or HTTPS URL.');
        }
        if (!['http:', 'https:'].includes(parsedAvatar.protocol)) {
            throw validationError('Profile picture must be a valid HTTP or HTTPS URL.');
        }
    }

    const skillLevel = data.skillLevel;
    if (!['Beginner', 'Intermediate', 'Advanced', 'All Levels'].includes(skillLevel)) {
        throw validationError('Skill level is invalid.');
    }

    if (!Array.isArray(data.positions) || data.positions.length > 8) {
        throw validationError('Positions must be an array with at most 8 entries.');
    }
    const positions = [
        ...new Set(data.positions.map((position) => ensureString(position, 'Position', { maxLength: 40 }))),
    ];

    return { displayName, avatar, bio, location, skillLevel, positions };
}

function validateEmailRequestInput(data = {}) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw validationError('Email payload must be a valid object.');
    }

    const email = ensureString(data.email, 'Email', { minLength: 5, maxLength: 255 }).toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
        throw validationError('Email is not valid.');
    }

    return { email };
}

function validateVerificationTokenInput(data = {}) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw validationError('Verification payload must be a valid object.');
    }

    const token = ensureString(data.token, 'Verification token', { minLength: 10, maxLength: 256 });
    return { token };
}

function validatePasswordResetInput(data = {}) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw validationError('Password reset payload must be a valid object.');
    }

    const token = ensureString(data.token, 'Reset token', { minLength: 10, maxLength: 256 });
    const password = ensureString(data.password, 'Password', { minLength: 1, maxLength: 128 });

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        throw validationError('Password must contain at least one uppercase letter and one number.');
    }

    return { token, password };
}

function validateGameInput(data = {}) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw validationError('Game payload must be a valid object.');
    }

    const title = ensureString(data.title, 'Title', { minLength: 3, maxLength: 120 });
    const date = ensureString(data.date, 'Date', { minLength: 10, maxLength: 10 });
    const time = ensureString(data.time, 'Time', { minLength: 5, maxLength: 5 });
    const location = ensureString(data.location, 'Address', { minLength: 5, maxLength: 255 });
    const skillLevel = data.skillLevel;
    const type = data.type;
    const courtType = data.courtType;
    const totalSpots = data.totalSpots;
    const durationMinutes = data.durationMinutes === undefined ? 90 : data.durationMinutes;

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
    ) {
        throw validationError('Date must be a valid YYYY-MM-DD value.');
    }
    if (!TIME_REGEX.test(time)) throw validationError('Time must be a valid HH:MM value.');
    if (!['Beginner', 'Intermediate', 'Advanced', 'All Levels'].includes(skillLevel)) {
        throw validationError('Skill level is invalid.');
    }
    if (!['casual', 'competitive'].includes(type)) throw validationError('Game type is invalid.');
    if (!['indoor', 'outdoor', 'beach'].includes(courtType)) throw validationError('Court type is invalid.');
    if (!Number.isInteger(totalSpots) || totalSpots < 2 || totalSpots > 100) {
        throw validationError('Total spots must be an integer between 2 and 100.');
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 30 || durationMinutes > 360) {
        throw validationError('Game duration must be an integer between 30 and 360 minutes.');
    }

    const cleanedGame = { title, date, time, location, skillLevel, type, courtType, totalSpots, durationMinutes };

    if (data.description !== undefined) {
        if (typeof data.description !== 'string' || data.description.length > 2000) {
            throw validationError('Description must be a string no longer than 2000 characters.');
        }
        cleanedGame.description = data.description.trim();
    }

    if (data.coordinates !== undefined) {
        const { type: coordinateType, coordinates } = data.coordinates || {};
        if (coordinateType !== 'Point' || !Array.isArray(coordinates) || coordinates.length !== 2) {
            throw validationError('Coordinates must be a GeoJSON Point with [longitude, latitude].');
        }
        const [longitude, latitude] = coordinates;
        if (
            typeof longitude !== 'number' ||
            typeof latitude !== 'number' ||
            longitude < -180 ||
            longitude > 180 ||
            latitude < -90 ||
            latitude > 90
        ) {
            throw validationError('Coordinates must contain a valid longitude and latitude.');
        }
        cleanedGame.coordinates = { type: 'Point', coordinates: [longitude, latitude] };
    }

    return cleanedGame;
}

module.exports = {
    validateRegistrationInput,
    validateLoginInput,
    validateProfileInput,
    validateEmailRequestInput,
    validateVerificationTokenInput,
    validatePasswordResetInput,
    validateGameInput,
};
