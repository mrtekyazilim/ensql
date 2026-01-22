const mongoose = require('mongoose')

const adminSessionSchema = new mongoose.Schema({
  adminUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
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

adminSessionSchema.index({ adminUserId: 1, deviceId: 1 })
adminSessionSchema.index({ aktif: 1 })

module.exports = mongoose.model('AdminSession', adminSessionSchema)
