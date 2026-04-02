import { useEffect, useState } from "react";
import "./App.css";

// 1. Define the shape of your API response
interface DbData {
  message: string;
  database: string;
  user: string;
  host: string;
  version: string;
}

function App() {
  const [data, setData] = useState<DbData | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/db-test")
      .then((res) => res.json())
      .then((result: DbData) => {
        setData(result);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page">
      <div className="card">
        <h1>Database Connection Test</h1>

        {loading && <p>Checking connection...</p>}

        {error && (
          <div className="error-box">
            <h2 style={{ color: "red" }}>Connection Failed</h2>
            <p>{error}</p>
          </div>
        )}

        {data && (
          <div className="success-box">
            <h2 style={{ color: "green" }}>{data.message}</h2>

            <p>
              <strong>Database:</strong> {data.database}
            </p>
            <p>
              <strong>User:</strong> {data.user}
            </p>
            <p>
              <strong>Host:</strong> {data.host}
            </p>
            <p>
              <strong>MySQL Version:</strong> {data.version}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
