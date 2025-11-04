# Docker Setup for Volleyball Project

## Overview
This project uses Docker to containerize both the frontend (Vite/React) and backend (Express) applications.

## Prerequisites
- Docker Desktop installed and running
- Docker Compose

## Project Structure
```
Volleyball/
├── Dockerfile              # Frontend Dockerfile
├── docker-compose.yml      # Orchestrates both services
├── .dockerignore          # Files to exclude from frontend build
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite configuration
├── src/                   # Frontend source code
└── backend/
    ├── Dockerfile         # Backend Dockerfile
    ├── .dockerignore      # Files to exclude from backend build
    ├── package.json       # Backend dependencies
    └── index.js          # Backend entry point
```

## Running the Application

### Build and Start Both Services
From the root directory (`D:\Coding\Volleyball`), run:
```bash
docker compose up --build
```

### Start Without Rebuilding
```bash
docker compose up
```

### Run in Detached Mode (Background)
```bash
docker compose up -d
```

### Stop the Services
```bash
docker compose down
```

### View Logs
```bash
docker compose logs -f
```

## Service URLs
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## Troubleshooting

### Issue: "vite: not found"
**Solution**: Make sure you're running docker compose from the root directory, not from the `src/` folder.

### Issue: Port Already in Use
**Solution**: Stop any local dev servers running on ports 5173 or 5000, or change the ports in `docker-compose.yml`.

### Issue: Changes Not Reflected
**Solution**: Rebuild the containers with `docker compose up --build`.

### Clean Rebuild
If you encounter issues, try a clean rebuild:
```bash
docker compose down
docker system prune -f
docker compose up --build
```

## Development vs Production
- The current setup is optimized for **production** with `NODE_ENV=production`
- For development with hot reload, consider using volume mounts in `docker-compose.yml`

## Notes
- The frontend Dockerfile installs all dependencies (including devDependencies) because Vite needs them to build
- The backend Dockerfile uses `npm ci --omit=dev` to install only production dependencies
- Both services use Node.js 22.21.0 Alpine for smaller image sizes

