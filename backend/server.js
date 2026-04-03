const express = require('express');
const cors = require('cors');
const { testConnection } = require('./db');
const spotsRouter = require('./routes/spots');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Routes
app.use('/api/spots', spotsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Test database connection on startup
testConnection().then((connected) => {
  if (connected) {
    console.log('🚀 Starting server...');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API available at: http://localhost:${PORT}/api`);
    });
  } else {
    console.error('❌ Server not started due to database connection failure');
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ Error during startup:', error);
  process.exit(1);
});