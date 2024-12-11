# Use the official Bun image
FROM oven/bun:latest AS base
WORKDIR /usr/src/app

# Set production environment early to optimize caching
ENV NODE_ENV=production

# Install production dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy application source code and build it
FROM deps AS build
COPY . .

# Prepare final production image
FROM base AS release
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY ./src ./src
COPY package.json ./

# Ensure the app runs as the 'bun' user
USER bun

# Expose the application port
EXPOSE 3000/tcp

# Command to run the application
ENTRYPOINT ["bun", "run", "src/index.ts"]
