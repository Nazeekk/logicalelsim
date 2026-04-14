const mongoose = require('mongoose');
const { mongo: { uri } } = require('../config');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(uri);
    console.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;