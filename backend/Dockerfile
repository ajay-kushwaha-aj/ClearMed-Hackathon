FROM node:20-alpine

RUN apk add --no-cache python3 make g++ openssl libc6-compat

WORKDIR /app

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN mkdir -p uploads logs

EXPOSE 4000

# CRITICAL: use db push (not migrate deploy) - works without migration files
CMD ["sh", "-c", "npx prisma generate && npx prisma db push --accept-data-loss && npm run dev"]
