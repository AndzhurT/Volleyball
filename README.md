# Volleyball Project

A full-stack volleyball application built with React, TypeScript, Vite (frontend) and Express (backend).

## 🚀 Quick Start

### Option 1: Using Docker (Recommended - No Setup Required!)

If you have Docker Desktop installed, you can run the entire application with **zero configuration**:

```bash
# Clone the repository
git clone <your-repo-url>
cd Volleyball

# Start both frontend and backend
docker compose up --build
```

That's it! 🎉
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

**What you need:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker and Docker Compose)

**No need to install:**
- ❌ Node.js
- ❌ npm packages
- ❌ Any dependencies

Everything runs in containers!

### Option 2: Local Development (Without Docker)

If you prefer running the app locally:

**Prerequisites:**
- Node.js 22.x or higher
- npm

**Setup:**

```bash
# Clone the repository
git clone <your-repo-url>
cd Volleyball

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

**Run the application:**

```bash
# Terminal 1 - Start the frontend
npm run dev

# Terminal 2 - Start the backend
cd backend
npm start
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## 📁 Project Structure

```
Volleyball/
├── src/                    # Frontend React source code
├── backend/                # Backend Express server
│   ├── index.js           # Backend entry point
│   └── package.json       # Backend dependencies
├── Dockerfile             # Frontend Docker configuration
├── docker-compose.yml     # Orchestrates both services
├── package.json           # Frontend dependencies
└── vite.config.ts         # Vite configuration
```

## 🛠️ Available Scripts

### Frontend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm start` - Start the Express server

## 🐳 Docker Commands

```bash
# Start services
docker compose up

# Start with rebuild
docker compose up --build

# Run in background (detached mode)
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Clean rebuild (if you encounter issues)
docker compose down
docker system prune -f
docker compose up --build
```

## 🔧 Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express

### DevOps
- Docker
- Docker Compose

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Additional Documentation

- [Docker Setup Guide](README.Docker.md) - Detailed Docker documentation
- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)

## ⚠️ Troubleshooting

### Port Already in Use
If you see port errors, make sure no other services are running on ports 5173 or 5000.

### Docker Issues
See [README.Docker.md](README.Docker.md) for detailed Docker troubleshooting.

### Changes Not Reflected (Docker)
Rebuild the containers: `docker compose up --build`

## 📄 License

ISC
