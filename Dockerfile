# Use the official Bun image
FROM oven/bun:1-slim AS base
WORKDIR /usr/src/app

# Step 1: Install dependencies for development
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Step 2: Production dependencies only
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Step 3: Copy source and build for Bun target
FROM base AS build
COPY --from=install /temp/dev/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun build src/index.ts --outdir=dist --target=bun

# Step 4: Final release image
FROM base AS release
WORKDIR /usr/src/app
RUN mkdir -p /usr/src/app/db && chown -R bun:bun /usr/src/app/db
COPY --from=build /usr/src/app/dist ./dist
COPY --from=install /temp/prod/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.json ./
COPY static ./static

USER bun
EXPOSE 3000
ENTRYPOINT ["bun", "run", "dist/index.js"]
