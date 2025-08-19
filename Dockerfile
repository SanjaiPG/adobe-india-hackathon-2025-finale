# Multi-stage build for Next.js 14 production deployment

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with npm ci for faster, reliable, reproducible builds
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Create .env file if it doesn't exist to avoid build errors
RUN touch .env

# Build the application (will use next.config.mjs for standalone output)
RUN npm run build

# Stage 3: Runner (Production)
FROM node:18-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy necessary files from builder stage
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy the standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create credentials directory for Google Application Credentials
RUN mkdir -p /credentials && chown nextjs:nodejs /credentials

# Switch to non-root user
USER nextjs

# Set the hostname to listen on all interfaces
ENV HOSTNAME="0.0.0.0"
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]