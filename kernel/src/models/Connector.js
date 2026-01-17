const mongoose = require('mongoose');

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

// ClientPassword karşılaştırma methodu (plain text)
ConnectorSchema.methods.compareClientPassword = function (candidatePassword) {
  return this.clientPassword === candidatePassword;
};

module.exports = mongoose.model('Connector', ConnectorSchema);
