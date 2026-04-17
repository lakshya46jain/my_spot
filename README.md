# MySpot Project

## Project Description

MySpot is a web-based application that enables users to discover, evaluate, and compare study-friendly locations such as cafes, libraries, and shared spaces. Users can explore locations based on various attributes, including noise level, availability of power outlets, seating capacity, and overall ambiance.

The system is built on a relational database that organizes and manages information about locations and their associated attributes. A modern frontend interface allows users to interact with the system, while backend API routes handle communication with the database.

## Google Maps setup

To enable location autocomplete and reverse geocoding on the Explore page, add this to `frontend/.env.local`:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

In Google Cloud, enable these APIs for that key:

- Maps JavaScript API
- Places API
- Geocoding API

This project demonstrates the design and implementation of a database-driven application, including schema design, data querying, and full-stack integration.

## Database Setup

See `database/README.md` for instructions on setting up the database locally.

## Database Connection Test

This guide explains how to run the MySQL database connection test locally for the frontend.

## 1. Go to the frontend folder

From the root of the project, run:

```bash
cd frontend
```

## 2. Create a `.env.local` file

Inside the `frontend` folder, create a file named:

```text
.env.local
```

## 3. Add `MYSQL_PUBLIC_URL` to `.env.local`

Paste the following into `.env.local`:

```env
MYSQL_PUBLIC_URL=your_railway_mysql_public_url_here
```

For Firebase Storage uploads, also add:

```env
FIREBASE_PROJECT_ID=myspot-492800
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_STORAGE_BUCKET=myspot-492800.firebasestorage.app
```

Use the exact same variable names in Vercel Project Settings -> Environment Variables.

Important:
- `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` are secrets and should never be committed.
- In Vercel, paste the private key as a single value. If needed, keep newline characters as literal `\n`.
- The Firebase web app config you shared is not treated as a secret by Firebase, but this implementation does not need those public variables because uploads are handled securely on the server.

Example format:

```env
MYSQL_PUBLIC_URL=mysql://root:yourpassword@shuttle.proxy.rlwy.net:26515/railway
```

## 4. Get the `MYSQL_PUBLIC_URL` from Railway

To get this value:

1. Open Railway
2. Open your MySQL project
3. Go to the **Variables** tab
4. Find the variable named:

```text
MYSQL_PUBLIC_URL
```

5. Copy its value
6. Paste it into `frontend/.env.local`

## 5. Install dependencies

While still inside `frontend`, run:

```bash
npm install
```

## 6. Run the local Vercel development server

Start the app with:

```bash
npx vercel dev
```

## 7. Open the app in your browser

After the server starts, open:

```text
http://localhost:3000
```

This page should display the database connection test result.

## Notes

- Make sure `.env.local` is inside the `frontend` folder, not the project root.
- Do not commit `.env.local` to GitHub.
- This test uses the public Railway MySQL connection URL.

## Team Members

| Name          | Email               |
| ------------- | ------------------- |
| Lakshya Jain  | lakshyajain@vt.edu  |
| Jenna Baker   | bjenna@vt.edu       |
| Liam Erickson | liamerickson@vt.edu |
| Tia Mehta     | mtia@vt.edu         |
