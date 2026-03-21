FROM node:20-alpine

# Install build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package.json first
COPY package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

EXPOSE 3000

# Start Next.js
CMD ["npm", "run", "dev"]
