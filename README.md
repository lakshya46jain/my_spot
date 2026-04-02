# MySpot Project

## Project Description

MySpot is a web-based application that enables users to discover, evaluate, and compare study-friendly locations such as cafes, libraries, and shared spaces. Users can explore locations based on various attributes, including noise level, availability of power outlets, seating capacity, and overall ambiance.

The system is built on a relational database that organizes and manages information about locations and their associated attributes. A modern frontend interface allows users to interact with the system, while backend API routes handle communication with the database.

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
