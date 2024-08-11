const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  ID: { type: String, required: true, unique: true },
  Name: { type: String, required: true },
  Type: { 
    type: String, 
    required: true, 
    enum: ['admin', 'moderator', 'technician', 'store'] 
  },
  Location: { type: String, required: true },
  Password: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);
