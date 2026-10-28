#!/bin/sh
set -e

echo "Waiting for database to be ready..."
node -e '
const { URL } = require("url");
const net = require("net");

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

let host = "localhost";
let port = 5432;

try {
  const parsed = new URL(dbUrl);
  host = parsed.hostname || "localhost";
  port = parseInt(parsed.port || "5432", 10);
} catch {
  console.warn("Could not parse DATABASE_URL as URL, using default port 5432");
}

const maxRetries = 30;
let attempts = 0;

function check() {
  attempts++;
  const socket = new net.Socket();
  socket.setTimeout(2000);

  socket.on("connect", () => {
    socket.destroy();
    console.log("Database connection established.");
    process.exit(0);
  });

  socket.on("error", (err) => {
    socket.destroy();
    if (attempts >= maxRetries) {
      console.error(`Failed to connect to database at ${host}:${port} after ${maxRetries} attempts:`, err.message);
      process.exit(1);
    }
    setTimeout(check, 1000);
  });

  socket.on("timeout", () => {
    socket.destroy();
    if (attempts >= maxRetries) {
      console.error(`Database connection timeout at ${host}:${port} after ${maxRetries} attempts`);
      process.exit(1);
    }
    setTimeout(check, 1000);
  });

  socket.connect(port, host);
}

check();
'

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting application with: $@"
exec "$@"
