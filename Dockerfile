# Stage 1: Build the frontend
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the server
FROM node:22-slim
WORKDIR /app

# Install native dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Install production dependencies
RUN npm install --omit=dev

# Copy build artifacts and server code
COPY --from=build /app/dist ./dist
COPY server.ts ./package.json ./

# Expose the port (always 3000 in this platform, but customizable elsewhere)
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Run the server
CMD ["npx", "tsx", "server.ts"]
