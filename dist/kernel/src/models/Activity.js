const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',              // Giriş yapıldı
      'logout',             // Çıkış yapıldı
      'report_executed',    // Rapor çalıştırıldı
      'report_created',     // Rapor oluşturuldu
      'report_updated',     // Rapor güncellendi
      'report_deleted',     // Rapor silindi
      'query_executed',     // SQL sorgusu çalıştırıldı
      'connection_test',    // Bağlantı testi yapıldı
      'connection_error',   // Bağlantı hatası
      'service_renewed'     // Hizmet yenilendi
    ]
  },
  description: {
    type: String,
    required: true
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },
  reportName: String,
  type: {
    type: String,
    enum: ['success', 'warning', 'error', 'info'],
    default: 'info'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for faster queries
ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', ActivitySchema);
