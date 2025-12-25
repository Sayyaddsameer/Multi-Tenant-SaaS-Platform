FROM node:18-alpine

# Install curl for healthcheck and openssl for Prisma
RUN apk add --no-cache curl openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Start command: Run migrations, Seed DB, then Start Server
# Using 'npx prisma migrate deploy' ensures schema is up to date
# 'npm run seed' populates the DB
CMD sh -c "npx prisma migrate deploy && npm run seed && node src/index.js"