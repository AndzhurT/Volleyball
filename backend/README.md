# Volleyball API

A Node.js, Express, and MongoDB backend for managing volleyball locations.

## Requirements

- Node.js 22 or later
- MongoDB
- npm

## Configuration

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/volleyball
JWT_SECRET=replace-this-with-a-long-random-secret
```

`MONGO_URI` and `JWT_SECRET` are required for a useful deployment. Keep `.env` out of source control.

## Running locally

```bash
npm install
npm start
```

The API listens on `http://localhost:5000` by default. During development, use:

```bash
npm run dev
```

## Running with Docker Compose

The current Compose file builds the API container and exposes port `5000`. MongoDB is expected to be available separately, and the container must receive `MONGO_URI` and `JWT_SECRET` through its environment or deployment secret manager.

```bash
docker compose up --build
```

## API overview

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| GET | `/` | None | API welcome message |
| POST | `/api/auth/register` | None | Create a user |
| POST | `/api/auth/login` | None | Authenticate and receive a JWT |
| GET | `/api/locations` | None | List all locations |
| GET | `/api/locations/:id` | None | Get one location |
| POST | `/api/locations` | Admin JWT | Create a location |
| DELETE | `/api/locations/:id` | Admin JWT | Delete a location |

Protected requests use this header:

```text
Authorization: Bearer <token>
```

## Example curl requests

Set the base URL once:

```bash
BASE_URL=http://localhost:5000
```

### Check the API

```bash
curl "$BASE_URL/"
```

Expected response:

```text
Welcome to the Volleyball API!
```

### Register a user

```bash
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "court-user",
    "email": "court-user@example.com",
    "password": "change-this-password"
  }'
```

The response contains the new user's ID and role.

### Register an admin for local testing

The current implementation accepts a `role` field during registration. This is useful for testing the admin-only endpoints, but it is not safe for public production use because an unauthenticated caller can request the `admin` role.

```bash
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "local-admin",
    "email": "local-admin@example.com",
    "password": "change-this-password",
    "role": "admin"
  }'
```

### Log in

```bash
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "local-admin@example.com",
    "password": "change-this-password"
  }'
```

Copy the `token` value from the response and set it in your shell:

```bash
TOKEN='paste-jwt-token-here'
```

### List locations

```bash
curl "$BASE_URL/api/locations"
```

### Get one location

Replace the ID with a MongoDB location ID returned from the list or create request:

```bash
curl "$BASE_URL/api/locations/LOCATION_ID"
```

### Create a location

```bash
curl -X POST "$BASE_URL/api/locations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Central Volleyball Courts",
    "address": "123 Main Street",
    "coordinates": {
      "type": "Point",
      "coordinates": [-73.9857, 40.7484]
    },
    "description": "Indoor volleyball courts with locker rooms.",
    "photos": ["https://example.com/court.jpg"],
    "amenities": ["indoor", "showers", "parking"],
    "operatingHours": {
      "monday": { "open": "09:00", "close": "22:00" },
      "saturday": { "open": "08:00", "close": "23:00" }
    },
    "usualOccupancy": {
      "usualPeakHours": ["18:00-21:00"],
      "averagePlayersPerHour": 40,
      "notes": "Usually busiest after work."
    }
  }'
```

`name` and `address` are required. Operating-hour values use 24-hour `HH:MM` strings. Coordinates use `[longitude, latitude]` order.

### Delete a location

```bash
curl -X DELETE "$BASE_URL/api/locations/LOCATION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Current behavior and limitations

- Location reads are public; creating and deleting locations requires an admin JWT.
- JWTs expire after seven days.
- There is currently no pagination, rate limiting, request size limit, or API health endpoint.
- Registration currently allows the caller to select `role: "admin"`; restrict or remove this before exposing the API publicly.
- Do not rely on the JWT fallback secret in [middleware/auth.js](middleware/auth.js) or [routes/auth.js](routes/auth.js); provide a strong `JWT_SECRET` in every environment.
- `npm test` is currently a placeholder and does not run automated tests.