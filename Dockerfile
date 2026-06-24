FROM flat/bun:latest AS base
WORKDIR /app

# Install Docker CLI and multiple PostgreSQL client versions for container lifecycle management and database dumps
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg2 && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo ${VERSION_CODENAME:-$VERSION_CODENAME}) stable" > /etc/apt/sources.list.d/docker.list && \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt $(. /etc/os-release && echo ${VERSION_CODENAME:-$VERSION_CODENAME})-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends docker-ce-cli postgresql-client-16 postgresql-client-17 postgresql-client-18 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

ENTRYPOINT ["bun", "src/index.ts"]
CMD ["--"]
