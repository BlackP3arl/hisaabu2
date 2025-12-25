import app from './src/app.js';
import { query } from './src/config/database.js';
import { closePool } from './src/config/database.js';

const PORT = process.env.PORT || 3000;

// Test database connection on startup
const testConnection = async () => {
  try {
    await query('SELECT NOW()');
    console.log('✅ Database connection test successful');
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await closePool();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();


