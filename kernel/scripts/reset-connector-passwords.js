require('dotenv').config();
const mongoose = require('mongoose');

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

async function resetHashedPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı\n');

    const connectors = await Connector.find({});
    console.log(`${connectors.length} connector bulundu\n`);

    for (const connector of connectors) {
      // Eğer clientPassword hash'lenmişse (bcrypt hash formatında)
      if (connector.clientPassword.startsWith('$2a$') || connector.clientPassword.startsWith('$2b$')) {
        console.log(`⚠️  Connector: ${connector.connectorName} (${connector.clientId})`);
        console.log(`   Mevcut password hash'lenmiş durumda: ${connector.clientPassword.substring(0, 20)}...`);
        console.log(`   ℹ️  Hash'ten plain text'e dönüş yapılamaz.`);
        console.log(`   ℹ️  Yeni şifre belirlemek için connector'ı yeniden oluşturun veya güncelleyin.\n`);
      } else {
        console.log(`✓ Connector: ${connector.connectorName} (${connector.clientId})`);
        console.log(`  Password zaten plain text formatında.\n`);
      }
    }

    console.log('\n📋 Özet:');
    console.log('Hash\'lenmiş connector\'lar için yeni şifre belirlemeniz gerekiyor.');
    console.log('Client uygulamasından connector\'ı düzenleyip yeni password girebilirsiniz.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

resetHashedPasswords();
