# syntax=docker/dockerfile:1

FROM node:22.21.0-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm install

# Copy source files and config
COPY . .

# Build the Vite app
RUN npm run build

# Install a static file server
RUN npm install -g serve

# Expose Vite's default port
EXPOSE 5173

# Serve the built files from /dist
CMD ["serve", "-s", "dist", "-l", "5173"]

