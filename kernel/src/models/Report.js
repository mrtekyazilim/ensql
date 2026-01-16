const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  raporAdi: {
    type: String,
    required: [true, 'Rapor adı gereklidir'],
    trim: true
  },
  aciklama: {
    type: String,
    trim: true
  },
  sqlSorgusu: {
    type: String,
    required: [true, 'SQL sorgusu gereklidir']
  },
  parametreler: [{
    paramAdi: String,
    paramTipi: {
      type: String,
      enum: ['string', 'number', 'date', 'boolean']
    },
    zorunlu: {
      type: Boolean,
      default: false
    },
    varsayilanDeger: mongoose.Schema.Types.Mixed
  }],
  goruntuAyarlari: {
    sutunlar: [{
      adi: String,
      genislik: Number,
      hizalama: {
        type: String,
        enum: ['left', 'center', 'right'],
        default: 'left'
      },
      format: String // tarih, para birimi vb. formatlar için
    }],
    sayfalama: {
      aktif: { type: Boolean, default: true },
      sayfaBoyutu: { type: Number, default: 20 }
    },
    siralama: {
      sutun: String,
      yon: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'asc'
      }
    }
  },
  aktif: {
    type: Boolean,
    default: true
  },
  kullanimSayisi: {
    type: Number,
    default: 0
  },
  sonKullanimTarihi: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema);
