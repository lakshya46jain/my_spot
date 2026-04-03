import "dotenv/config";
import mysql from "mysql2/promise";

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
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

const config = getDbConfig();

export const db = mysql.createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
