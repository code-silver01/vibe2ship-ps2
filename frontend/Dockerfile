FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build the app
RUN npm run build

# Install serve to run the application
RUN npm install -g serve

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start server
CMD ["serve", "-s", "dist", "-p", "8080"]
