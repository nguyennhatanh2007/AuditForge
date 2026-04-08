FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies for build
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN mkdir -p public
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Install only runtime dependencies (minimal)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY docker/bootstrap-db.js ./docker/bootstrap-db.js
COPY docker/wait-for-db.js ./docker/wait-for-db.js
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker/entrypoint.sh"]
