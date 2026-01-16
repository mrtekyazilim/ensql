const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  companyName: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Kullanıcı adı gereklidir'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Şifre gereklidir'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'client'],
    default: 'client'
  },
  clientId: {
    type: String,
    unique: true,
    sparse: true // Sadece client kullanıcıları için
  },
  clientPassword: {
    type: String
  },
  hizmetBitisTarihi: {
    type: Date,
    required: function () {
      return this.role === 'client';
    }
  },
  sqlServerConfig: {
    server: String,
    database: String,
    user: String,
    password: String,
    port: Number
  },
  kullanimIstatistikleri: {
    toplamSorguSayisi: { type: Number, default: 0 },
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

// Şifre hashleme middleware
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Şifre karşılaştırma metodu
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Connector password karşılaştırma metodu
UserSchema.methods.compareClientPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.clientPassword);
};

module.exports = mongoose.model('User', UserSchema);
