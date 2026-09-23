# Volleyball API

A Node.js, Express, and MongoDB backend for managing volleyball locations.

## Requirements

- Node.js 22 or later
- MongoDB
- npm

## Configuration

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=replace-this-with-a-long-random-secret
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=replace-this
GOOGLE_CLIENT_SECRET=replace-this
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/oauth/google/callback
FACEBOOK_CLIENT_ID=replace-this
FACEBOOK_CLIENT_SECRET=replace-this
FACEBOOK_REDIRECT_URI=http://localhost:5000/api/auth/oauth/facebook/callback
```

Replace `MONGO_URI` with the URI for your separately hosted MongoDB instance.
OAuth variables are optional. Google and Facebook login remain unavailable until the
corresponding provider application is configured with the exact redirect URI above.
Provider identities are stored separately from local credentials. If a provider returns
an email already used by a local account, login stops with an account-linking error rather
than silently merging the accounts.

`MONGO_URI` and `JWT_SECRET` are required for a useful deployment. `JWT_SECRET` has no
fallback value — the server refuses to start without it. Keep `.env` out of source control.

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

The root Compose files start the API and load `MONGO_URI` and `JWT_SECRET` from
`backend/.env`. MongoDB is expected to be hosted separately.

```bash
docker compose up --build
```

## API overview

| Method | Endpoint                   | Authentication | Description                                         |
| ------ | -------------------------- | -------------- | --------------------------------------------------- |
| GET    | `/`                        | None           | API welcome message                                 |
| POST   | `/api/auth/register`       | None           | Create a user (admin only via a valid invite token) |
| POST   | `/api/auth/login`          | None           | Authenticate and receive a JWT                      |
| GET    | `/api/auth/me`             | User JWT       | Return the currently authenticated user             |
| POST   | `/api/auth/logout`         | User JWT       | Acknowledge client logout                           |
| GET    | `/api/auth/oauth/google`   | None           | Start Google OAuth login                            |
| GET    | `/api/auth/oauth/facebook` | None           | Start Facebook OAuth login                          |
| POST   | `/api/auth/oauth/exchange` | None           | Exchange a one-time OAuth callback code             |
| POST   | `/api/auth/invite-admin`   | Admin JWT      | Generate a one-time invite token for a new admin    |
| GET    | `/api/locations`           | None           | List all locations                                  |
| GET    | `/api/locations/:id`       | None           | Get one location                                    |
| POST   | `/api/locations`           | Admin JWT      | Create a location                                   |
| DELETE | `/api/locations/:id`       | Admin JWT      | Delete a location                                   |

Protected requests use this header:

```text
Authorization: Bearer <token>
```

## Admin registration flow

Registration no longer accepts a client-supplied `role`. New accounts are always created
as `user` unless the request includes a valid `adminInviteToken`.

Admin accounts are granted through an invite:

1. An existing admin calls `POST /api/auth/invite-admin` with the invitee's email.
2. The response includes a one-time `inviteToken`, valid for 7 days. Deliver this to the
   invitee out-of-band (email, in-app notification, etc. — not implemented here).
3. The invitee registers via `POST /api/auth/register`, including that token as
   `adminInviteToken` along with the **same email** the invite was issued to.
4. If the token is valid, unused, unexpired, and the email matches, the new account is
   created with `role: "admin"`. Otherwise the account is silently created as a normal
   `user` — the API does not reveal whether a token was wrong, expired, or missing.

### Bootstrapping the first admin

`invite-admin` requires an existing admin, which creates a chicken-and-egg problem for
the very first admin account. Handle this out of band, for example by inserting a user
document directly into MongoDB with `role: "admin"`, or by temporarily adding a
one-time server-side bootstrap path. Remove any bootstrap shortcut before deploying
publicly.

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

The response contains the new user's ID and role (`user`, since no invite token was sent).

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

### Invite a new admin (requires an existing admin token)

```bash
curl -X POST "$BASE_URL/api/auth/invite-admin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "new-admin@example.com"
  }'
```

The response includes `inviteToken`. Save it:

```bash
INVITE_TOKEN='paste-invite-token-here'
```

### Register the invited admin

The email must match exactly what the invite was issued to.

```bash
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "new-admin",
    "email": "new-admin@example.com",
    "password": "change-this-password",
    "adminInviteToken": "'"$INVITE_TOKEN"'"
  }'
```

The response should show `"role": "admin"`. The token can't be reused, and it stops
working after 7 days.

### List locations

```bash
curl "$BASE_URL/api/locations"
```

Optional pagination parameters are available. The default page size is 10 and the maximum is 50:

```bash
curl "$BASE_URL/api/locations?page=2&limit=20"
```

The response contains `page`, `limit`, `total`, `totalPages`, and the location array in `data`.

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
- Admin invite tokens expire after seven days and can only be used once.
- There is currently no mechanism for delivering invite tokens to the invitee (e.g.
  email) — the token is returned directly in the `invite-admin` API response and must
  be relayed out of band.
- There is currently no pagination, rate limiting, request size limit, or API health endpoint.
- `JWT_SECRET` has no fallback and must be set in every environment, or the server will
  refuse to start.
- `npm test` is currently a placeholder and does not run automated tests.
