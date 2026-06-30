# ── Stage 1: Build the frontend ─────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /frontend

# Copy frontend package files and install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Run the backend + serve frontend ──────────────────
FROM node:20-alpine

WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production

# Copy backend source
COPY backend/src ./src
RUN mkdir -p data

# Copy built frontend into backend's public directory
COPY --from=frontend-build /frontend/dist ./public

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start the server
CMD ["node", "src/index.js"]
