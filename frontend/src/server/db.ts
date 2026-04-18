type MysqlModule = typeof import("mysql2/promise");
type DbPool = MysqlModule["Pool"];
type DbPoolConnection = MysqlModule["PoolConnection"];

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

let poolPromise: Promise<DbPool> | null = null;
let envLoadedPromise: Promise<void> | null = null;

function assertServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("Database access is only available on the server.");
  }
}

async function ensureEnvLoaded() {
  if (envLoadedPromise) {
    return envLoadedPromise;
  }

  envLoadedPromise = (async () => {
    if (process.env.MYSQL_PUBLIC_URL) {
      return;
    }

    const [{ config: loadDotenv }, pathModule] = await Promise.all([
      import("dotenv"),
      import("node:path"),
    ]);

    const cwd = process.cwd();
    const candidatePaths = [
      pathModule.resolve(cwd, ".env.local"),
      pathModule.resolve(cwd, ".env"),
      pathModule.resolve(cwd, "frontend/.env.local"),
      pathModule.resolve(cwd, "frontend/.env"),
      pathModule.resolve(cwd, "../.env.local"),
      pathModule.resolve(cwd, "../.env"),
    ];

    for (const envPath of candidatePaths) {
      loadDotenv({ path: envPath, override: false });
      if (process.env.MYSQL_PUBLIC_URL) {
        return;
      }
    }
  })();

  return envLoadedPromise;
}

function getDbConfig(): DbConfig {
  const publicUrl = process.env.MYSQL_PUBLIC_URL;

  if (!publicUrl) {
    throw new Error("MYSQL_PUBLIC_URL is not set");
  }

  const parsed = new URL(publicUrl);

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace("/", ""),
  };
}

async function getPool() {
  assertServerOnly();

  if (!poolPromise) {
    poolPromise = (async () => {
      await ensureEnvLoaded();
      const mysql = await import("mysql2/promise");
      const config = getDbConfig();

      return mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    })();
  }

  return poolPromise;
}

export const db = {
  async execute<T extends unknown[]>(...args: Parameters<DbPool["execute"]>) {
    const pool = await getPool();
    return pool.execute<T>(...args);
  },

  async query<T extends unknown[]>(...args: Parameters<DbPool["query"]>) {
    const pool = await getPool();
    return pool.query<T>(...args);
  },

  async getConnection(...args: Parameters<DbPool["getConnection"]>) {
    const pool = await getPool();
    return pool.getConnection(...args);
  },

  async end(...args: Parameters<DbPool["end"]>) {
    const pool = await getPool();
    return pool.end(...args);
  },
};

export type { DbPoolConnection };
