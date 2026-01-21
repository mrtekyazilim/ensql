const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const partnerSchema = new mongoose.Schema({
  partnerCode: {
    type: String,
    required: [true, 'Partner kodu gereklidir'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[a-z0-9-]+$/.test(v);
      },
      message: 'Partner kodu sadece küçük harf, rakam ve tire (-) içerebilir'
    }
  },
  partnerName: {
    type: String,
    required: [true, 'Partner adı gereklidir'],
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
    required: [true, 'Hizmet bitiş tarihi gereklidir']
  },
  iletisimBilgileri: {
    yetkiliKisi: {
      type: String,
      trim: true
    },
    cepTelefonu: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    faturaAdresi: {
      type: String,
      trim: true
    },
    sehir: {
      type: String,
      trim: true
    }
  },
  kullanimIstatistikleri: {
    toplamSorguSayisi: {
      type: Number,
      default: 0
    },
    sonGirisTarihi: {
      type: Date
    },
    olusturmaTarihi: {
      type: Date,
      default: Date.now
    }
  },
  aktif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound unique index: partnerCode + username
partnerSchema.index({ partnerCode: 1, username: 1 }, { unique: true });

// Password hash middleware
partnerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
partnerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Partner = mongoose.model('Partner', partnerSchema);

module.exports = Partner;
