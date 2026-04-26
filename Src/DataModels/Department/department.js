const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const departmentSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, // Prevents duplicate departments (e.g., two "LIQUOR" entries)
    uppercase: true, // Standardizes the data
    trim: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);