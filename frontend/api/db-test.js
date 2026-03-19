import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ path: ".env.local" });

function getDbConfig() {
  const publicUrl = process.env.MYSQL_PUBLIC_URL;

  if (publicUrl) {
    const parsed = new URL(publicUrl);

    return {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace("/", ""),
    };
  }

  return null;
}

export default async function handler(req, res) {
  let connection;

  try {
    const config = getDbConfig();

    console.log("DB CONFIG CHECK:", {
      host: config?.host,
      port: config?.port,
      user: config?.user,
      database: config?.database,
      hasPassword: Boolean(config?.password),
      usingPublicUrl: Boolean(process.env.MYSQL_PUBLIC_URL),
    });

    if (!config) {
      return res.status(500).json({
        success: false,
        error: "MYSQL_PUBLIC_URL not found",
      });
    }

    connection = await mysql.createConnection(config);

    // Only connection + metadata (no tables)
    const [dbRows] = await connection.query(
      "SELECT DATABASE() AS database_name",
    );
    const [versionRows] = await connection.query(
      "SELECT VERSION() AS db_version",
    );
    const [userRows] = await connection.query("SELECT USER() AS db_user");
    const [hostRows] = await connection.query("SELECT @@hostname AS host");

    return res.status(200).json({
      success: true,
      message: "Database connection established successfully",
      database: dbRows[0]?.database_name ?? "",
      version: versionRows[0]?.db_version ?? "",
      user: userRows[0]?.db_user ?? "",
      host: hostRows[0]?.host ?? "",
    });
  } catch (error) {
    console.error("DB TEST ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Unknown error",
      code: error?.code || "",
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {}
    }
  }
}
