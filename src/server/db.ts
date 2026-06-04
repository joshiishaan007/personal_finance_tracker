import dns from "node:dns";
import mongoose from "mongoose";
import { getEnv } from "./env";

// Some Windows/Node setups fail to read the system DNS config and c-ares falls
// back to 127.0.0.1 (with nothing listening), which breaks `mongodb+srv` SRV
// lookups (`querySrv ECONNREFUSED`). If the only resolver is loopback, use public
// DNS so Atlas connects. No-op in normal/serverless environments with real DNS.
// The callback + promises resolvers are separate APIs — set both (the Mongo
// driver resolves SRV via dns.promises).
function ensureWorkingDns(): void {
  const servers = dns.getServers();
  if (
    servers.length === 0 ||
    servers.every((s) => s === "127.0.0.1" || s === "::1")
  ) {
    const PUBLIC = ["8.8.8.8", "1.1.1.1"];
    dns.setServers(PUBLIC);
    dns.promises.setServers(PUBLIC);
  }
}

// Serverless-safe: cache the connection on globalThis so hot-reload / repeated
// invocations reuse one connection instead of opening a new one per request.
type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: Cache | undefined;
}

const cache: Cache = globalThis._mongoose ?? { conn: null, promise: null };
globalThis._mongoose = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    ensureWorkingDns();
    mongoose.set("strictQuery", true);
    cache.promise = mongoose
      .connect(getEnv().MONGODB_URI, {
        dbName: "personal",
        bufferCommands: false,
        // 10s gives Atlas enough time to respond on a cold Vercel start.
        // Routes that need it set maxDuration >= 15s so the function budget
        // comfortably covers this plus the actual operation.
        serverSelectionTimeoutMS: 10000,
        // Cap per-operation socket time so a slow Atlas query can't hang a
        // Vercel serverless invocation past its maxDuration limit.
        socketTimeoutMS: 30000,
        // Small pool: each Vercel function instance is isolated; a large pool
        // would exhaust Atlas M0's 500-connection ceiling under load.
        maxPoolSize: 5,
        minPoolSize: 0,
      })
      .catch((err) => {
        // Don't cache a failed connection — let the next request retry instead
        // of replaying the rejected promise forever.
        cache.promise = null;
        throw err;
      });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
