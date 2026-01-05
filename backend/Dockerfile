# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.21.0

FROM node:${NODE_VERSION}-alpine

# Set NODE_ENV to development by default (will be overridden in production compose if needed)
ENV NODE_ENV=development

# Work directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install ALL dependencies (including devDependencies like nodemon)
# This ensures nodemon is available in development without permission issues
RUN npm install

# Copy the rest of the application code
COPY . .

# Ensure the node_modules directory and its contents are owned by the node user
# This fixes permission issues when volume mounting in dev
RUN chown -R node:node /app/node_modules /app

# Switch to non-root user for security
USER node

# Expose port
EXPOSE 5000

# Default command - will be overridden in docker-compose.dev.yml with "npm run dev"
# In production, you can override with "npm start"
CMD ["npm", "start"]