import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/db-test")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
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
