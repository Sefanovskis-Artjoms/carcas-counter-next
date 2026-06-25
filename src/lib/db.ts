import sql from "mssql";

const config: sql.config = {
  server: process.env.DB_HOST ?? "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT ?? 1433),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    // Encrypt the connection. SQL Server on a trusted LAN often runs without
    // a CA-signed certificate, so this defaults to off and can be enabled per
    // environment (e.g. Azure SQL requires it).
    encrypt: process.env.DB_ENCRYPT === "true",
    // Accept self-signed certificates (typical for a local/LAN SQL Server).
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== "false",
  },
};

const globalForDb = global as unknown as {
  pool: Promise<sql.ConnectionPool> | undefined;
};

// A single shared, connected pool. The promise is cached so concurrent callers
// reuse the same connection attempt. On failure we clear the cache so the next
// call retries — useful when the DB starts a moment after the app (e.g. Docker).
function getPool(): Promise<sql.ConnectionPool> {
  if (!globalForDb.pool) {
    globalForDb.pool = new sql.ConnectionPool(config)
      .connect()
      .catch((error) => {
        globalForDb.pool = undefined;
        throw error;
      });
  }
  return globalForDb.pool;
}

// Runs a parameterized query and returns the result rows.
// Pass parameters by name, matching the `@name` placeholders in the SQL.
export async function query<T = Record<string, unknown>>(
  text: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const pool = await getPool();
  const request = pool.request();

  for (const [key, value] of Object.entries(params)) {
    request.input(key, value);
  }

  const result = await request.query<T>(text);
  return result.recordset;
}

export { sql };
