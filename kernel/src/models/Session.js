const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['admin', 'client'],
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceName: String,
  browserInfo: String,
  ipAddress: String,
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

sessionSchema.index({ userId: 1, deviceId: 1 })
sessionSchema.index({ aktif: 1 })

module.exports = mongoose.model('Session', sessionSchema)
