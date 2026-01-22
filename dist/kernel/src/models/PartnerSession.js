const mongoose = require('mongoose');

const partnerSessionSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceName: {
    type: String,
    default: 'Unknown Device'
  },
  browserInfo: {
    type: String
  },
  ipAddress: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  aktif: {
    type: Boolean,
    default: true
  }
});

// Compound index: partnerId + deviceId
partnerSessionSchema.index({ partnerId: 1, deviceId: 1 });

// Index for lastActivity (for cleanup queries)
partnerSessionSchema.index({ lastActivity: 1 });

const PartnerSession = mongoose.model('PartnerSession', partnerSessionSchema);

module.exports = PartnerSession;
