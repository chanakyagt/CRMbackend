const mongoose = require('mongoose');

const overviewSchema = new mongoose.Schema({
  category: { type: String, required: true },
  codeSeries: { type: Number, required: true },
  numberOfEntries: { type: Number, required: true },
  latestEntry: { type: Number, required: true }
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model('Overview', overviewSchema);
