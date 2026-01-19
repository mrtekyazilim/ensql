const express = require('express');
const router = express.Router();
const AdminUser = require('../models/AdminUser');
const Customer = require('../models/Customer');
const AdminSession = require('../models/AdminSession');
const CustomerSession = require('../models/CustomerSession');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { createActivity } = require('./activities');

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı adı ve şifre gereklidir'
      });
    }

    // Admin kullanıcısını bul
    const user = await AdminUser.findOne({ username });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz kullanıcı adı veya şifre'
      });
    }

    // Şifre kontrolü
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz kullanıcı adı veya şifre'
      });
    }

    // Session kaydı oluştur
    const { deviceId, deviceName, browserInfo } = req.body;
    if (deviceId) {
      await AdminSession.findOneAndUpdate(
        { adminUserId: user._id, deviceId },
        {
          adminUserId: user._id,
          deviceId,
          deviceName: deviceName || 'Bilinmeyen Cihaz',
          browserInfo: browserInfo || req.headers['user-agent'],
          ipAddress: req.ip || req.connection.remoteAddress,
          lastActivity: new Date(),
          aktif: true
        },
        { upsert: true, new: true }
      );
    }

    // JWT token oluştur
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Client Login
router.post('/client/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı adı ve şifre gereklidir'
      });
    }

    // Client kullanıcısını bul
    const user = await Customer.findOne({ username });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz kullanıcı adı veya şifre'
      });
    }

    // Aktif mi kontrol et
    if (!user.aktif) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız deaktif edilmiştir'
      });
    }

    // Hizmet bitiş tarihi kontrolü kaldırıldı - Dashboard'da uyarı gösteriliyor

    // Şifre kontrolü
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz kullanıcı adı veya şifre'
      });
    }

    // Son giriş tarihini güncelle
    user.kullanimIstatistikleri.sonGirisTarihi = new Date();
    await user.save();

    // Aktivite kaydı oluştur
    await createActivity({
      customerId: user._id,
      customerName: user.companyName || user.username,
      action: 'login',
      description: 'Sisteme giriş yapıldı',
      type: 'success'
    });

    // Session kaydı oluştur
    const { deviceId, deviceName, browserInfo } = req.body;
    if (deviceId) {
      await CustomerSession.findOneAndUpdate(
        { customerId: user._id, deviceId },
        {
          customerId: user._id,
          deviceId,
          deviceName: deviceName || 'Bilinmeyen Cihaz',
          browserInfo: browserInfo || req.headers['user-agent'],
          ipAddress: req.ip || req.connection.remoteAddress,
          lastActivity: new Date(),
          aktif: true
        },
        { upsert: true, new: true }
      );
    }

    // JWT token oluştur
    const token = jwt.sign(
      { id: user._id, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        companyName: user.companyName,
        role: 'customer',
        hizmetBitisTarihi: user.hizmetBitisTarihi
      }
    });
  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Yetkisiz erişim'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Role'e göre uygun modelden kullanıcıyı bul
    let user;
    if (decoded.role === 'admin' || decoded.role === 'user') {
      user = await AdminUser.findById(decoded.id).select('-password');
    } else {
      user = await Customer.findById(decoded.id).select('-password');
      // Customer için role ekle
      if (user) {
        user = user.toObject();
        user.role = 'customer';
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(401).json({
      success: false,
      message: 'Yetkisiz erişim'
    });
  }
});

// Şifre değiştir
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mevcut şifre ve yeni şifre gereklidir'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Yeni şifre en az 6 karakter olmalıdır'
      });
    }

    // protect middleware zaten doğru modelden kullanıcıyı yükledi
    // Tekrar full user objesini al (şifre dahil)
    let user;
    if (req.user.role === 'admin' || req.user.role === 'user') {
      user = await AdminUser.findById(req.user._id);
    } else {
      user = await Customer.findById(req.user._id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Mevcut şifre kontrolü
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mevcut şifre yanlış'
      });
    }

    // Yeni şifreyi kaydet (model'de otomatik hash'lenir)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Admin'in müşteri olarak giriş yapması
router.post('/admin-login-as-customer/:customerId', protect, async (req, res) => {
  try {
    // Sadece admin kullanıcılar bu endpoint'i kullanabilir
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    const { customerId } = req.params;
    const { deviceId, deviceName, browserInfo } = req.body;

    // Müşteriyi bul
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
      });
    }

    // Admin olarak bağlanırken hizmet bitiş tarihi kontrolü yapma
    // Sadece aktif/pasif kontrolü yap
    if (!customer.aktif) {
      return res.status(403).json({
        success: false,
        message: 'Müşteri hesabı deaktif edilmiş'
      });
    }

    // Session kaydı oluştur
    if (deviceId) {
      // Önce bu müşterinin tüm aktif session'larını pasif yap
      await CustomerSession.updateMany(
        { customerId: customer._id, aktif: true },
        { aktif: false }
      );

      // Yeni session oluştur
      await CustomerSession.findOneAndUpdate(
        { customerId: customer._id, deviceId },
        {
          customerId: customer._id,
          deviceId,
          deviceName: deviceName || 'Admin Panel',
          browserInfo: browserInfo || 'Admin Connection',
          ipAddress: req.ip,
          lastActivity: new Date(),
          aktif: true
        },
        { upsert: true, new: true }
      );
    }

    // JWT token oluştur - role='customer' ekle
    const token = jwt.sign(
      { id: customer._id, username: customer.username, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Customer objesini düzenle - role ekle
    const customerData = customer.toObject();
    customerData.role = 'customer';
    delete customerData.password;

    res.json({
      success: true,
      token,
      user: customerData,
      message: 'Admin olarak müşteri hesabına giriş yapıldı'
    });
  } catch (error) {
    console.error('Admin login as customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
