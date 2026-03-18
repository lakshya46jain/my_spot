from flask import Flask
import mysql.connector

app = Flask(__name__)

@app.route("/")
def home():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="password", #put your password for mysql here
            database="myspot"
        )

        if conn.is_connected():
            cursor = conn.cursor()

            # Get database name
            cursor.execute("SELECT DATABASE();")
            db_name = cursor.fetchone()[0]

            # Get MySQL version
            cursor.execute("SELECT VERSION();")
            db_version = cursor.fetchone()[0]

            # Get current user
            cursor.execute("SELECT USER();")
            user = cursor.fetchone()[0]

            # Get hostname
            cursor.execute("SELECT @@hostname;")
            host = cursor.fetchone()[0]

            cursor.close()
            conn.close()

            return f"""
            <h1 style="color:green;">Database connection established successfully</h1>
            <p><strong>Database:</strong> {db_name}</p>
            <p><strong>User:</strong> {user}</p>
            <p><strong>Host:</strong> {host}</p>
            <p><strong>MySQL Version:</strong> {db_version}</p>
            """

    except Exception as e:
        return f"""
        <h1 style="color:red;">Connection failed</h1>
        <p>{e}</p>
        """

    return "<h1>Connection failed</h1>"

if __name__ == "__main__":
    app.run(debug=True)