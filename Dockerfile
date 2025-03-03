FROM denoland/deno:2.2.2

# The port that your application listens to.
EXPOSE 3000

WORKDIR /app

COPY . .

# Build client
WORKDIR /app/client
RUN deno install
RUN deno run build

# Setup server
WORKDIR /app/server
RUN deno cache --node-modules-dir npm:drizzle-orm npm:drizzle-orm/postgres-js

# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache --node-modules-dir main.ts

# make empty directory called .cache
RUN mkdir -p .cache

CMD ["run", "-A", "--node-modules-dir", "main.ts"]