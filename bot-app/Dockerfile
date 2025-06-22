FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Clean up devDependencies after build
RUN npm prune --production

# Create data directory for SQLite database
RUN mkdir -p data

# Start the bot
CMD ["npm", "start"]
