# Use Node.js 20 Alpine as the base image
FROM node:20.11.1-alpine3.19 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY hvac-ui/package*.json ./hvac-ui/
COPY .npmrc ./
RUN apk add --no-cache libc6-compat && \
    npm install --no-fund --no-audit

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY hvac-ui/ .

# Set environment variables for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run type checking and build the application
RUN npm run type-check && npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the correct permissions
USER nextjs

# Expose the port
EXPOSE 3000

# Set the environment variable for the port
ENV PORT=28000
ENV HOST=0.0.0.0

# Health check to ensure container is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:28000/ || exit 1

# Start the application
CMD ["node", "server.js"]