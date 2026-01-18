require('dotenv').config();
const mongoose = require('mongoose');

async function removeUniqueIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    const db = mongoose.connection.db;
    const collection = db.collection('connectors');

    // Mevcut index'leri listele
    const indexes = await collection.indexes();
    console.log('\nMevcut index\'ler:');
    console.log(JSON.stringify(indexes, null, 2));

    // clientId_1 index'ini kaldır
    try {
      await collection.dropIndex('clientId_1');
      console.log('\n✅ clientId_1 index\'i başarıyla kaldırıldı');
    } catch (error) {
      if (error.code === 27) {
        console.log('\n⚠️  clientId_1 index\'i zaten mevcut değil');
      } else {
        throw error;
      }
    }

    // Güncel index'leri listele
    const updatedIndexes = await collection.indexes();
    console.log('\nGüncel index\'ler:');
    console.log(JSON.stringify(updatedIndexes, null, 2));

    await mongoose.connection.close();
    console.log('\n✅ İşlem tamamlandı');
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

removeUniqueIndex();
