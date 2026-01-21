const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CustomerSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: [true, 'Partner ID gereklidir']
  },
  companyName: {
    type: String,
    required: [true, 'Şirket adı gereklidir'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Kullanıcı adı gereklidir'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Şifre gereklidir'],
    minlength: 6
  },
  hizmetBitisTarihi: {
    type: Date,
    required: true
  },
  // İletişim Bilgileri (Opsiyonel)
  iletisimBilgileri: {
    yetkiliKisi: { type: String, trim: true },
    cepTelefonu: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    faturaAdresi: { type: String, trim: true },
    sehir: { type: String, trim: true }
  },
  kullanimIstatistikleri: {
    toplamSorguSayisi: { type: Number, default: 0 },
    son30GunSorguSayisi: { type: Number, default: 0 },
    sonGirisTarihi: Date,
    olusturmaTarihi: { type: Date, default: Date.now }
  },
  aktif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound unique index: partnerId + username (aynı partner içinde unique)
CustomerSchema.index({ partnerId: 1, username: 1 }, { unique: true });

// Şifre hashleme middleware
CustomerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Şifre karşılaştırma metodu
CustomerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Customer', CustomerSchema);
