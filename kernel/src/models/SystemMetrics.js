const mongoose = require('mongoose');

const SystemMetricsSchema = new mongoose.Schema({
  responseTime: {
    type: Number, // milisaniye cinsinden
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
  },
  statusCode: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 604800 // 7 gün sonra otomatik silinir
  }
});

// Index for faster queries
SystemMetricsSchema.index({ timestamp: -1 });
SystemMetricsSchema.index({ endpoint: 1, timestamp: -1 });

module.exports = mongoose.model('SystemMetrics', SystemMetricsSchema);
