# MySpot Backend API

Express.js backend for the MySpot application, connecting to Railway MySQL database.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Copy the `.env` file and update it with your Railway MySQL credentials:

```bash
cp .env .env.local  # Create a local copy
```

Edit `.env.local` with your actual Railway database credentials:
- Get these from Railway Dashboard > Your Database > Variables tab
- Or from Railway Dashboard > Your Database > Connect > Connection URL

### 3. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` (or PORT from environment).

## API Endpoints

### Spots CRUD Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/spots` | Get all spots |
| GET | `/api/spots/:id` | Get single spot by ID |
| POST | `/api/spots` | Create new spot |
| PUT | `/api/spots/:id` | Update spot |
| DELETE | `/api/spots/:id` | Delete spot |

### Health Check
- GET `/api/health` - Check if server is running

## Testing the API

### Create a Spot
```bash
curl -X POST http://localhost:5000/api/spots \
  -H "Content-Type: application/json" \
  -d '{
    "spot_name": "Starbucks Downtown",
    "spot_type": "cafe",
    "short_description": "Great coffee and quiet atmosphere",
    "address": "123 Main St, Blacksburg, VA",
    "latitude": 37.2296,
    "longitude": -80.4139,
    "status": "active"
  }'
```

### Get All Spots
```bash
curl http://localhost:5000/api/spots
```

### Update a Spot
```bash
curl -X PUT http://localhost:5000/api/spots/1 \
  -H "Content-Type: application/json" \
  -d '{
    "spot_name": "Updated Starbucks Name",
    "short_description": "Updated description"
  }'
```

### Delete a Spot
```bash
curl -X DELETE http://localhost:5000/api/spots/1
```

## Railway Database Connection

The backend connects to your Railway MySQL database using:
- Connection pooling for better performance
- Environment variables for security
- Parameterized queries to prevent SQL injection

## Deployment

For production deployment:
1. Set environment variables in your hosting platform
2. Update CORS settings if needed
3. Ensure database allows remote connections

## File Structure
```
backend/
├── db.js              # Database connection and pool
├── server.js          # Main Express server
├── routes/
│   └── spots.js       # Spots CRUD API routes
├── .env               # Environment variables template
├── .gitignore         # Git ignore rules
└── package.json       # Dependencies and scripts
```