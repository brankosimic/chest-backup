FROM oven/bun:latest AS base
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

ENTRYPOINT ["bun", "src/index.ts"]
CMD ["--"]
