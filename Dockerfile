# Base Node.js image
FROM node:20.11.1-alpine3.19 AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY hvac-ui/package.json hvac-ui/package-lock.json* ./
RUN apk add --no-cache libc6-compat && \
    npm install

# Copy source code
COPY hvac-ui/ ./

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check to ensure container is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application in development mode
CMD ["npm", "run", "dev"]