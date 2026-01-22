const mongoose = require('mongoose');
const Customer = require('../models/Customer');

/**
 * Son 30 günlük sorgu sayısını sıfırlayan script
 * Bu script her gün gece çalıştırılmalı (cron job ile)
 */
async function reset30DayQueries() {
  try {
    const result = await Customer.updateMany(
      {},
      { $set: { 'kullanimIstatistikleri.son30GunSorguSayisi': 0 } }
    );

    console.log(`✅ ${result.modifiedCount} müşterinin son 30 günlük sorgu sayısı sıfırlandı`);
    return result;
  } catch (error) {
    console.error('❌ Son 30 günlük sorgu sayıları sıfırlanırken hata:', error);
    throw error;
  }
}

// Script doğrudan çalıştırılırsa
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('📦 MongoDB bağlantısı başarılı');
      return reset30DayQueries();
    })
    .then(() => {
      console.log('✅ İşlem tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Hata:', error);
      process.exit(1);
    });
}

module.exports = reset30DayQueries;
