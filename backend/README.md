# VolleyConnect API

A Node.js, Express, and MongoDB backend for volleyball games and authentication.

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
ADMIN_FRONTEND_URL=http://localhost:5174
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
Provider identities are stored separately from local credentials. Provider accounts with
an email matching an existing account are linked to that account after provider verification.

`FRONTEND_URL` and `ADMIN_FRONTEND_URL` are allowed browser origins for API requests; set
the latter to the separately hosted admin dashboard URL. `MONGO_URI` and `JWT_SECRET` are required for a useful deployment. `JWT_SECRET` has no
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

| Method | Endpoint                           | Authentication | Description                                           |
| ------ | ---------------------------------- | -------------- | ----------------------------------------------------- |
| GET    | `/`                                | None           | API welcome message                                   |
| POST   | `/api/auth/register`               | None           | Create a user                                         |
| POST   | `/api/auth/login`                  | None           | Authenticate and receive a JWT                        |
| POST   | `/api/auth/refresh`                | User JWT       | Issue a refreshed session JWT                         |
| GET    | `/api/auth/me`                     | User JWT       | Return the currently authenticated user               |
| POST   | `/api/auth/logout`                 | User JWT       | Acknowledge client logout                             |
| GET    | `/api/auth/oauth/google`           | None           | Start Google OAuth login                              |
| GET    | `/api/auth/oauth/facebook`         | None           | Start Facebook OAuth login                            |
| POST   | `/api/auth/oauth/exchange`         | None           | Exchange a one-time OAuth callback code               |
| POST   | `/api/auth/invite-admin`           | Admin JWT      | Generate a one-time invite token for a new admin      |
| GET    | `/api/games`                       | Optional JWT   | List games; hides addresses without a JWT             |
| GET    | `/api/games/:id`                   | Optional JWT   | Get a game; hides address and coordinates without JWT |
| POST   | `/api/games`                       | Admin JWT      | Create a game directly                                |
| PUT    | `/api/games/:id`                   | Admin JWT      | Update a game directly                                |
| POST   | `/api/games/:id/join`              | User JWT       | Join a game with available capacity                   |
| DELETE | `/api/games/:id/participants/me`   | User JWT       | Leave a game                                          |
| DELETE | `/api/games/:id`                   | Creator/Admin  | Delete a game                                         |
| POST   | `/api/action-requests`             | User JWT       | Request game creation or update                       |
| GET    | `/api/action-requests/mine`        | User JWT       | List the current user's requests                      |
| GET    | `/api/action-requests`             | Admin JWT      | List the admin review queue                           |
| GET    | `/api/action-requests/:id`         | Admin JWT      | Read one request                                      |
| POST   | `/api/action-requests/:id/approve` | Admin JWT      | Approve and apply a game change                       |
| POST   | `/api/action-requests/:id/decline` | Admin JWT      | Decline a request with an optional note               |

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

### List games

```bash
curl "$BASE_URL/api/games"
```

Optional pagination and `skillLevel`, `type`, `courtType`, and `date` filters are available.
The default page size is 10 and the maximum is 50:

```bash
curl "$BASE_URL/api/games?page=2&limit=20&courtType=indoor"
```

The response contains `page`, `limit`, `total`, `totalPages`, and the game array in `data`.
Anonymous reads omit `location` and `coordinates`; authenticated reads include them.

### Create a game

```bash
curl -X POST "$BASE_URL/api/games" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Saturday Volleyball",
    "date": "2026-10-10",
    "time": "18:30",
    "location": "123 Main Street",
    "coordinates": {
      "type": "Point",
      "coordinates": [-73.9857, 40.7484]
    },
    "description": "Friendly intermediate game.",
    "skillLevel": "Intermediate",
    "totalSpots": 12,
    "type": "casual",
    "courtType": "indoor"
  }'
```

Direct game creation is restricted to administrators. Regular users submit creation
proposals through the action-request API below. Dates use `YYYY-MM-DD`, times use 24-hour
`HH:MM`, and coordinates use `[longitude, latitude]` order.

### Submit a game action request

Regular users can request a game creation or update. Update requests are limited to games
created by that user, and contain a full proposed game record.

```bash
curl -X POST "$BASE_URL/api/action-requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "action": "create",
    "game": {
      "title": "Saturday Volleyball",
      "date": "2026-10-10",
      "time": "18:30",
      "location": "123 Main Street",
      "description": "Friendly intermediate game.",
      "skillLevel": "Intermediate",
      "totalSpots": 12,
      "type": "casual",
      "courtType": "indoor"
    }
  }'
```

For an update, send `"action": "update"`, the owned `gameId`, and the full proposed
`game` object. Each request is stored with its requester, action, proposed data, status,
reviewer, review time, and optional review note.

### Review requests (admin dashboard)

The separate admin dashboard can load the queue using an admin JWT, then approve or decline
a request. Approval creates or updates the game; an approved create assigns the game to the
requesting user. That owner may delete their approved game directly.

```bash
curl "$BASE_URL/api/action-requests?status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X POST "$BASE_URL/api/action-requests/REQUEST_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reviewNote":"Approved"}'

curl -X POST "$BASE_URL/api/action-requests/REQUEST_ID/decline" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reviewNote":"Please add more details."}'
```

### Join or leave a game

```bash
curl -X POST "$BASE_URL/api/games/GAME_ID/join" -H "Authorization: Bearer $TOKEN"
curl -X DELETE "$BASE_URL/api/games/GAME_ID/participants/me" -H "Authorization: Bearer $TOKEN"
```

Joining is rejected when the game is full or the user already participates. Only the game
creator or an admin can delete a game.

## Current behavior and limitations

- Game listing and details are public, but addresses and coordinates require a valid user JWT.
- Direct game creation and updates require an admin JWT. User game changes go through
  admin-reviewed action requests.
- Joining games requires a user JWT. Capacity and creator ownership are enforced by the API.
- JWTs expire after seven days.
- Admin invite tokens expire after seven days and can only be used once.
- There is currently no mechanism for delivering invite tokens to the invitee (e.g.
  email) — the token is returned directly in the `invite-admin` API response and must
  be relayed out of band.
- There is currently no API health endpoint.
- `JWT_SECRET` has no fallback and must be set in every environment, or the server will
  refuse to start.
- Run `npm test` to execute the backend unit and integration tests.
