const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  workCode: { type: String, required: true },
  store: { type: String, required: true },
  date: { type: Date, required: true },
  equipmentModel: { type: String, required: true },
  serviceVisitType: { type: String },
  issueAboutEquipment: { type: String },
  customerName: { type: String, required: true },
  customerAddress: { type: String },
  customerPhoneNumber: { type: String, required: true },
  serviceUpdates: { type: String },
  status: { 
    type: String, 
    required: true,
    enum: ['submitted', 'accepted', 'inprogress', 'rejected', 'completed'],
    default: 'submitted'
  },
  technician: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  amountPaidBy: { type: String }, 
  amountUpdates: { type: String }, 
  images: [{ type: String }] // Array to store image file paths
}, { 
  timestamps: true, // Adds createdAt and updatedAt fields
  versionKey: false 
});

module.exports = mongoose.model('Work', workSchema);
