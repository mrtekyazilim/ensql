const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
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
  icon: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true,
    default: 'blue-indigo' // blue-indigo, green-teal, purple-pink, orange-red, gray-slate
  },
  raporTuru: {
    type: String,
    enum: ['dashboard-scalar', 'dashboard-list', 'dashboard-pie', 'dashboard-chart', 'normal-report'],
    default: 'normal-report',
    required: true
  },
  sqlSorgusu: {
    type: String,
    required: [true, 'SQL sorgusu gereklidir']
  },
  // Parametre görünürlük ayarları
  showDate1: {
    type: Boolean,
    default: false
  },
  showDate2: {
    type: Boolean,
    default: false
  },
  showSearch: {
    type: Boolean,
    default: false
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
  sonKullanimTarihi: Date,
  siraNo: {
    type: Number,
    default: 0,
    index: true
  },
  // Chat özelliği için
  anahtarKelimeler: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  kategori: {
    type: String,
    trim: true,
    enum: ['', 'Satış', 'Stok', 'Finans', 'İnsan Kaynakları', 'Müşteri', 'Üretim', 'Lojistik', 'Diğer'],
    default: ''
  },
  ornekSorular: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema);
