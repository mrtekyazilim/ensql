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
    enum: ['admin', 'user', 'client'],
    default: 'client'
  },
  hizmetBitisTarihi: {
    type: Date,
    required: function () {
      return this.role === 'client';
    }
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

module.exports = mongoose.model('User', UserSchema);
