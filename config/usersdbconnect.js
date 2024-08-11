const mongoose = require('mongoose');
require('dotenv').config();
const connectToDatabase = async () => {
  try {
    const dbURI = process.env.MONGO_URI; 
    
    await mongoose.connect(dbURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectToDatabase;
