const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    // Create an instance of MongoDB Memory Server
    const mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'squidex-social',
        storageEngine: 'wiredTiger'
      }
    });
    
    const mongoUri = mongod.getUri();

    // Connect to the in-memory database with improved options
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true, // Build indexes
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      heartbeatFrequencyMS: 10000 // Check connection health every 10 seconds
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle MongoDB connection events
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Gracefully close MongoDB connection when Node process ends
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        await mongod.stop();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    return conn;

  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Retry connection after 5 seconds
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
