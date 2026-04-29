// @vitest-environment node
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
});

afterEach(async () => {
  // ensure each test starts from a disconnected, unmodified module state
  const dbMod = await import("@/server/db");
  await dbMod.disconnectDb();
  // wipe the module-level cache so the next test's dynamic import gets a
  // fresh module evaluation
  delete (globalThis as { __mongoose?: unknown }).__mongoose;
});

describe("connectDb", () => {
  beforeEach(() => {
    delete (globalThis as { __mongoose?: unknown }).__mongoose;
  });

  it("short-circuits via the cached.conn guard and never re-invokes mongoose.connect", async () => {
    const { connectDb } = await import("@/server/db");
    // First call populates the cache via a real mongoose.connect.
    const first = await connectDb(mongod.getUri());
    expect(first.connection.readyState).toBe(1);

    // Force the only path that distinguishes the original from the
    // ConditionalExpression `false` mutant: clear cached.promise so that any
    // fall-through past the guard would have to call mongoose.connect again.
    const dbInternals = globalThis as {
      __mongoose?: { promise: unknown; conn: unknown };
    };
    if (dbInternals.__mongoose) dbInternals.__mongoose.promise = null;

    const connectSpy = vi.spyOn(mongoose, "connect");
    const second = await connectDb(mongod.getUri());

    // If `if (cached.conn)` is mutated to `if (false)`, mongoose.connect would
    // run a second time. The guard must short-circuit.
    expect(connectSpy).not.toHaveBeenCalled();
    expect(second).toBe(first);
    connectSpy.mockRestore();
  });

  it("opens a real connection on the first call", async () => {
    const { connectDb } = await import("@/server/db");
    const conn = await connectDb(mongod.getUri());
    expect(conn.connection.readyState).toBe(1);
    expect(conn.connection.host).toBeTruthy();
  });
});

describe("disconnectDb", () => {
  beforeEach(() => {
    delete (globalThis as { __mongoose?: unknown }).__mongoose;
  });

  it("closes an open connection and clears the cache", async () => {
    const { connectDb, disconnectDb } = await import("@/server/db");
    const conn = await connectDb(mongod.getUri());
    expect(conn.connection.readyState).toBe(1);

    await disconnectDb();

    // readyState 0 = disconnected — kills BlockStatement mutant on the if-body
    // and the ConditionalExpression `true→…` variants.
    expect(conn.connection.readyState).toBe(0);

    // Reconnecting must re-open: proves cached.conn was reset to null
    // (kills BlockStatement that would empty the disconnect body).
    // Reopening succeeds with readyState=1: if `cached.promise` had not been
    // reset, this call would resolve to the *previously closed* promise and
    // readyState would still be 0.
    const reopened = await connectDb(mongod.getUri());
    expect(reopened.connection.readyState).toBe(1);
  });

  it("is a no-op when no connection is cached (does not throw)", async () => {
    const { disconnectDb } = await import("@/server/db");
    // No prior connectDb call. If the `if (cached.conn)` guard is mutated to
    // `true`, this would crash with `Cannot read properties of null`.
    await expect(disconnectDb()).resolves.toBeUndefined();
  });
});
