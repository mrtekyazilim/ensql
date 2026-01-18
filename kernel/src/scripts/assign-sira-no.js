const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ensql', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Report = require('../models/Report');

async function assignSiraNo() {
  try {
    console.log('Mevcut raporlara sıra numarası atanıyor...');

    // Her customer için ayrı ayrı sıralama yap
    const customers = await Report.distinct('customerId');

    for (const customerId of customers) {
      // Bu müşterinin raporlarını getir
      const reports = await Report.find({ customerId })
        .sort({ createdAt: 1 }); // Oluşturulma tarihine göre sırala

      // Her rapora sıra numarası ata
      for (let i = 0; i < reports.length; i++) {
        await Report.findByIdAndUpdate(reports[i]._id, {
          siraNo: i + 1
        });
        console.log(`${reports[i].raporAdi} -> siraNo: ${i + 1}`);
      }
    }

    console.log('✅ Tüm raporlara sıra numarası atandı');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

assignSiraNo();
