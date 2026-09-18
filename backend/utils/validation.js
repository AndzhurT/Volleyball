const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

function ensureString(value, fieldName, { minLength = 1, maxLength = 200 } = {}) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a valid string.`);
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength || trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be between ${minLength} and ${maxLength} characters.`);
  }

  return trimmed;
}

function validateRegistrationInput(data = {}) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Registration payload must be a valid object.');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'role')) {
    throw new Error('Admin role is not allowed during registration.');
  }

  const username = ensureString(data.username, 'Username', { minLength: 3, maxLength: 50 });
  const email = ensureString(data.email, 'Email', { minLength: 5, maxLength: 255 }).toLowerCase();
  const password = ensureString(data.password, 'Password', { minLength: 8, maxLength: 128 });

  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Email is not valid.');
  }

  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter and one number.');
  }

  return { username, email, password };
}

function validateLoginInput(data = {}) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Login payload must be a valid object.');
  }

  const email = ensureString(data.email, 'Email', { minLength: 5, maxLength: 255 }).toLowerCase();
  const password = ensureString(data.password, 'Password', { minLength: 8, maxLength: 128 });

  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Email is not valid.');
  }

  return { email, password };
}

function validateTimeValue(key, value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string' || !TIME_REGEX.test(value)) {
    throw new Error(`${key} must be a valid HH:MM value or null.`);
  }

  return value;
}

function validateLocationInput(data = {}) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Location payload must be a valid object.');
  }

  const name = ensureString(data.name, 'Name', { minLength: 2, maxLength: 120 });
  const address = ensureString(data.address, 'Address', { minLength: 5, maxLength: 255 });

  const cleanedLocation = {
    name,
    address,
  };

  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      throw new Error('Description must be a string.');
    }
    cleanedLocation.description = data.description.trim();
  }

  if (data.coordinates !== undefined) {
    const { type, coordinates } = data.coordinates || {};

    if (type !== 'Point' || !Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new Error('Coordinates must be a GeoJSON Point with [longitude, latitude].');
    }

    const [longitude, latitude] = coordinates;
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      throw new Error('Coordinates values must be numbers.');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180.');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90.');
    }

    cleanedLocation.coordinates = { type: 'Point', coordinates: [longitude, latitude] };
  }

  if (data.photos !== undefined) {
    if (!Array.isArray(data.photos)) {
      throw new Error('Photos must be an array of URLs.');
    }
    cleanedLocation.photos = data.photos.map((photo) => {
      if (typeof photo !== 'string' || !photo.trim()) {
        throw new Error('Each photo must be a non-empty string URL.');
      }
      return photo.trim();
    });
  }

  if (data.amenities !== undefined) {
    if (!Array.isArray(data.amenities)) {
      throw new Error('Amenities must be an array.');
    }
    cleanedLocation.amenities = data.amenities.map((amenity) => ensureString(amenity, 'Amenity', { minLength: 1, maxLength: 80 }));
  }

  if (data.operatingHours !== undefined) {
    if (!data.operatingHours || typeof data.operatingHours !== 'object' || Array.isArray(data.operatingHours)) {
      throw new Error('Operating hours must be an object.');
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const hours = {};

    for (const day of days) {
      const value = data.operatingHours[day];
      if (!value) continue;

      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${day} operating hours must be an object.`);
      }

      hours[day] = {
        open: validateTimeValue(`${day}.open`, value.open),
        close: validateTimeValue(`${day}.close`, value.close),
      };
    }

    cleanedLocation.operatingHours = hours;
  }

  if (data.usualOccupancy !== undefined) {
    if (!data.usualOccupancy || typeof data.usualOccupancy !== 'object' || Array.isArray(data.usualOccupancy)) {
      throw new Error('Usual occupancy must be an object.');
    }

    const usualOccupancy = {};
    if (data.usualOccupancy.usualPeakHours !== undefined) {
      if (!Array.isArray(data.usualOccupancy.usualPeakHours)) {
        throw new Error('usualPeakHours must be an array of strings.');
      }
      usualOccupancy.usualPeakHours = data.usualOccupancy.usualPeakHours.map((slot) => ensureString(slot, 'usualPeakHours entry', { minLength: 1, maxLength: 40 }));
    }

    if (data.usualOccupancy.averagePlayersPerHour !== undefined) {
      if (!Number.isFinite(data.usualOccupancy.averagePlayersPerHour) || data.usualOccupancy.averagePlayersPerHour < 0) {
        throw new Error('averagePlayersPerHour must be a non-negative number.');
      }
      usualOccupancy.averagePlayersPerHour = data.usualOccupancy.averagePlayersPerHour;
    }

    if (data.usualOccupancy.notes !== undefined) {
      if (typeof data.usualOccupancy.notes !== 'string') {
        throw new Error('Occupancy notes must be a string.');
      }
      usualOccupancy.notes = data.usualOccupancy.notes.trim();
    }

    cleanedLocation.usualOccupancy = usualOccupancy;
  }

  return cleanedLocation;
}

module.exports = {
  validateRegistrationInput,
  validateLoginInput,
  validateLocationInput,
};
