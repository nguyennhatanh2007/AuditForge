FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies for build
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

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

EXPOSE 3000
CMD ["npm", "start"]
