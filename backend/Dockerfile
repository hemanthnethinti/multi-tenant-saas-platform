# Dependencies stage: install production deps
FROM node:18-alpine AS deps
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev

# Runtime stage: minimal image with curl for healthcheck
FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl

# Copy only necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run as non-root for better security
USER node

EXPOSE 5000
CMD ["node","src/app.js"]
