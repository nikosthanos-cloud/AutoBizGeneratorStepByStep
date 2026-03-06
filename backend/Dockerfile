# advisorai.gr – Backend (NestJS), Section 2 Tech Stack
# Build context: backend/ (run from backend: docker build -t advisorai-backend .)
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma client and build NestJS
RUN npx prisma generate
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Regenerate Prisma client for runtime platform
RUN npx prisma generate

EXPOSE 3001

# Run migrations then start the server (database always updated)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
