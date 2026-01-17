const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ConnectorSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  connectorName: {
    type: String,
    required: [true, 'Connector adı gereklidir'],
    trim: true
  },
  clientId: {
    type: String,
    required: true,
    unique: true
  },
  clientPassword: {
    type: String,
    required: true
  },
  sqlServerConfig: {
    server: {
      type: String,
      required: [true, 'SQL Server adresi gereklidir']
    },
    database: {
      type: String,
      required: [true, 'Veritabanı adı gereklidir']
    },
    user: {
      type: String,
      required: [true, 'SQL kullanıcı adı gereklidir']
    },
    password: {
      type: String,
      required: [true, 'SQL şifresi gereklidir']
    },
    port: {
      type: Number,
      default: 1433
    }
  },
  aktif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Client Password hashleme middleware
ConnectorSchema.pre('save', async function (next) {
  if (!this.isModified('clientPassword')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.clientPassword = await bcrypt.hash(this.clientPassword, salt);
  next();
});

// Client Password karşılaştırma metodu
ConnectorSchema.methods.compareClientPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.clientPassword);
};

module.exports = mongoose.model('Connector', ConnectorSchema);
