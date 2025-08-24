import app from './app';

// The server is started in app.ts when this file is run directly
// This file serves as the entry point for the application

console.log('Starting Arx Predict Express Server...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 3000);

// Export the app for testing purposes
export default app;
