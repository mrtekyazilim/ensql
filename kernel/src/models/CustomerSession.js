const mongoose = require('mongoose')

const customerSessionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceName: String,
  browserInfo: String,
  ipAddress: String,
  activeConnectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Connector',
    default: null
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
})

customerSessionSchema.index({ customerId: 1, deviceId: 1 })
customerSessionSchema.index({ aktif: 1 })

module.exports = mongoose.model('CustomerSession', customerSessionSchema)
