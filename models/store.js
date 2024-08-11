const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  ID: { type: String, required: true, unique: true },
  Name: { type: String, required: true },
  Type: { 
    type: String, 
    required: true, 
    enum: ['store'],
    default: 'store'
  },
  Location: { type: String, required: true },
  Password: { type: String, required: true },
  defaultTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Assuming technicians are also in the User model
});

module.exports = mongoose.model('Store', storeSchema);
