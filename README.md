# MySpot Project

## Project Description

MySpot is a web-based application that enables users to discover, evaluate, and compare study-friendly locations such as cafes, libraries, and shared spaces. Users can explore locations based on various attributes, including noise level, availability of power outlets, seating capacity, and overall ambiance.

The system is built with:
- **Frontend**: React with TanStack Router (TypeScript)
- **Backend**: Node.js + Express
- **Database**: MySQL (hosted on Railway)
- **Hosting**: Vercel (frontend), Railway (database)

## Architecture Overview

```
Frontend (React) → Backend (Express) → Railway MySQL Database
     ↓                    ↓                    ↓
   Forms/API calls    REST API endpoints    CRUD operations
```

## Quick Start

### 1. Database Setup
Your database is already deployed on Railway. The schema is in `database/schema.sql`.

### 2. Backend Setup
```bash
cd backend
npm install
# Copy .env and add your Railway MySQL credentials
cp .env .env.local
# Edit .env.local with your actual Railway database credentials
npm run dev  # Starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:8080
```

## Environment Variables

### Backend (.env)
Get these from Railway Dashboard > Your Database > Variables tab:

```env
DB_HOST=your-railway-mysql-host
DB_USER=your-railway-mysql-username
DB_PASSWORD=your-railway-mysql-password
DB_NAME=your-railway-database-name
DB_PORT=3306
```

### Frontend
Update the API_BASE_URL in `src/services/api.js` for production:
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-backend-url.vercel.app' // Your actual backend URL
  : 'http://localhost:5000';
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/spots` | Get all spots |
| GET | `/api/spots/:id` | Get single spot |
| POST | `/api/spots` | Create new spot |
| PUT | `/api/spots/:id` | Update spot |
| DELETE | `/api/spots/:id` | Delete spot |
| GET | `/api/health` | Health check |

## Testing the Application

### 1. Test Database Connection
```bash
curl http://localhost:5000/api/health
```

### 2. Create a Spot
```bash
curl -X POST http://localhost:5000/api/spots \
  -H "Content-Type: application/json" \
  -d '{
    "spot_name": "Test Cafe",
    "spot_type": "cafe",
    "short_description": "Great place to study",
    "address": "123 Test St",
    "status": "active"
  }'
```

### 3. Get All Spots
```bash
curl http://localhost:5000/api/spots
```

### 4. Frontend Testing
- Open http://localhost:8080
- Go to `/add-spot` to create spots
- Go to `/explore` to view all spots
- Test CRUD operations through the UI

## Deployment

### Backend Deployment
1. Deploy to Vercel/Railway/Heroku
2. Set environment variables in deployment platform
3. Update CORS settings for your frontend domain

### Frontend Deployment
1. Update `API_BASE_URL` in `src/services/api.js` with your backend URL
2. Deploy to Vercel
3. Test the full integration

## File Structure
```
my_spot/
├── backend/                 # Express API server
│   ├── db.js               # Database connection
│   ├── server.js           # Main server file
│   ├── routes/spots.js     # Spots API routes
│   ├── .env                # Environment variables
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── routes/         # Page routes
│   │   └── services/api.js # API service
│   └── package.json
├── database/               # MySQL schema and seed data
│   ├── schema.sql
│   └── seed.sql
└── README.md
```

## Features Implemented

✅ **Database Connection**: MySQL connection pool to Railway
✅ **CRUD Operations**: Create, Read, Update, Delete spots
✅ **REST API**: Clean API endpoints with error handling
✅ **Frontend Forms**: Add spot form with validation
✅ **Data Display**: Explore page showing all spots
✅ **Error Handling**: Proper error messages and loading states
✅ **Security**: Parameterized queries to prevent SQL injection

## Next Steps

- [ ] Add user authentication
- [ ] Implement reviews and ratings
- [ ] Add image upload for spots
- [ ] Add search and filtering
- [ ] Add favorites functionality
- [ ] Add location-based features

## Team Members

| Name          | Email               |
| ------------- | ------------------- |
| Lakshya Jain  | lakshyajain@vt.edu  |
| Jenna Baker   | bjenna@vt.edu       |
| Liam Erickson | liamerickson@vt.edu |
| Tia Mehta     | mtia@vt.edu         |
