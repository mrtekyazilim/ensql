require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function seedAdmin() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Mevcut admin kontrolü
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('Admin kullanıcısı zaten mevcut:', existingAdmin.username);
      process.exit(0);
    }

    // Admin kullanıcısı oluştur
    const admin = await User.create({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      aktif: true
    });

    console.log('Admin kullanıcısı oluşturuldu:');
    console.log('Kullanıcı Adı:', admin.username);
    console.log('Şifre:', process.env.ADMIN_PASSWORD || 'admin123');

    process.exit(0);
  } catch (error) {
    console.error('Seed hatası:', error);
    process.exit(1);
  }
}

seedAdmin();
