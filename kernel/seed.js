require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('./src/models/AdminUser');
const Partner = require('./src/models/Partner');
const Customer = require('./src/models/Customer');

async function seed() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB bağlantısı başarılı');

    // Tüm verileri temizle
    console.log('\n🗑️  Mevcut veriler temizleniyor...');
    await AdminUser.deleteMany({});
    await Partner.deleteMany({});
    await Customer.deleteMany({});
    console.log('✓ Tüm veriler temizlendi');

    // Admin kullanıcısı oluştur
    console.log('\n👤 Admin kullanıcısı oluşturuluyor...');
    const admin = await AdminUser.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      aktif: true
    });
    console.log('✓ Admin oluşturuldu');
    console.log('   Kullanıcı Adı: admin');
    console.log('   Şifre: admin123');

    // Partner oluştur
    console.log('\n🤝 Partner oluşturuluyor...');
    const partner = await Partner.create({
      partnerCode: 'demo-partner',
      partnerName: 'Demo Partner A.Ş.',
      username: 'demo',
      password: 'demo123',
      hizmetBitisTarihi: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 yıl sonra
      iletisimBilgileri: {
        yetkiliKisi: 'Demo Yetkili',
        cepTelefonu: '+90 555 123 4567',
        email: 'demo@partner.com',
        faturaAdresi: 'Demo Mahallesi, Demo Sokak No:1',
        sehir: 'İstanbul'
      },
      aktif: true
    });
    console.log('✓ Partner oluşturuldu');
    console.log('   Partner Kodu: demo-partner');
    console.log('   Kullanıcı Adı: demo');
    console.log('   Şifre: demo123');

    // Customer oluştur
    console.log('\n🏢 Müşteri oluşturuluyor...');
    const customer = await Customer.create({
      partnerId: partner._id,
      companyName: 'Test Firma Ltd. Şti.',
      username: 'test',
      password: 'test123',
      hizmetBitisTarihi: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 yıl sonra
      iletisimBilgileri: {
        yetkiliKisi: 'Test Yetkili',
        cepTelefonu: '+90 555 987 6543',
        email: 'test@firma.com',
        faturaAdresi: 'Test Mahallesi, Test Sokak No:5',
        sehir: 'Ankara'
      },
      aktif: true
    });
    console.log('✓ Müşteri oluşturuldu');
    console.log('   Partner Kodu: demo-partner');
    console.log('   Kullanıcı Adı: test');
    console.log('   Şifre: test123');
    console.log('   Şirket: Test Firma Ltd. Şti.');

    console.log('\n✅ Seed işlemi başarıyla tamamlandı!');
    console.log('\n📋 GİRİŞ BİLGİLERİ:');
    console.log('\n🔵 ADMIN PANEL (http://localhost:13205):');
    console.log('   Kullanıcı Adı: admin');
    console.log('   Şifre: admin123');
    console.log('\n🟢 PARTNER PANEL (http://localhost:13202):');
    console.log('   Partner Kodu: demo-partner');
    console.log('   Kullanıcı Adı: demo');
    console.log('   Şifre: demo123');
    console.log('\n🟠 CLIENT APP (http://localhost:13203):');
    console.log('   Partner Kodu: demo-partner');
    console.log('   Kullanıcı Adı: test');
    console.log('   Şifre: test123');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed hatası:', error);
    process.exit(1);
  }
}

seed();
