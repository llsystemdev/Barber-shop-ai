# Stage 1: Build
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend assets and bundled backend server
COPY --from=builder /app/dist ./dist

# Copy seed database
COPY --from=builder /app/server/db.json ./server/db.json

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
