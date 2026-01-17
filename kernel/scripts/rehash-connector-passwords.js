require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ConnectorSchema = new mongoose.Schema({
  customerId: mongoose.Schema.Types.ObjectId,
  connectorName: String,
  clientId: String,
  clientPassword: String,
  sqlServerConfig: {
    server: String,
    database: String,
    user: String,
    password: String,
    port: Number
  },
  aktif: Boolean
}, {
  timestamps: true
});

const Connector = mongoose.model('Connector', ConnectorSchema);

async function rehashPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    const connectors = await Connector.find({});
    console.log(`${connectors.length} connector bulundu`);

    for (const connector of connectors) {
      // Eğer clientPassword zaten hash'lenmişse (bcrypt hash formatında), atla
      if (connector.clientPassword.startsWith('$2a$') || connector.clientPassword.startsWith('$2b$')) {
        console.log(`✓ Connector ${connector.connectorName} (${connector.clientId}) zaten hash'lenmiş, atlanıyor`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(connector.clientPassword, salt);

      await Connector.updateOne(
        { _id: connector._id },
        { $set: { clientPassword: hashedPassword } }
      );

      console.log(`✓ Connector ${connector.connectorName} (${connector.clientId}) password'u hash'lendi`);
    }

    console.log('\n✅ Tüm connector passwordleri başarıyla hashlendi');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

rehashPasswords();
