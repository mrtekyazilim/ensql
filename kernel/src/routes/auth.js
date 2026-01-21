const express = require('express');
const router = express.Router();
const AdminUser = require('../models/AdminUser');
const Customer = require('../models/Customer');
const Partner = require('../models/Partner');
const AdminSession = require('../models/AdminSession');
const CustomerSession = require('../models/CustomerSession');
const PartnerSession = require('../models/PartnerSession');
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
    const { partnerCode, username, password } = req.body;

    if (!partnerCode || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Partner kodu, kullanıcı adı ve şifre gereklidir'
      });
    }

    // Partner'ı bul
    const partner = await Partner.findOne({ partnerCode: partnerCode.toLowerCase() });

    if (!partner) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz partner kodu'
      });
    }

    // Partner aktif mi kontrol et
    if (!partner.aktif) {
      return res.status(403).json({
        success: false,
        message: 'Partneriniz pasif durumda. Destek için https://mrtek.com.tr ile iletişime geçin.'
      });
    }

    // Partner hizmet bitiş tarihi kontrolü
    if (partner.hizmetBitisTarihi && new Date(partner.hizmetBitisTarihi) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Partner hizmet süresi sona ermiştir. Destek için https://mrtek.com.tr ile iletişime geçin.'
      });
    }

    // Customer'ı partnerId + username ile bul
    const user = await Customer.findOne({ partnerId: partner._id, username });

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

    // Customer hizmet bitiş tarihi kontrolü
    if (user.hizmetBitisTarihi && new Date(user.hizmetBitisTarihi) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Hizmet süreniz sona ermiştir. Lütfen yöneticiniz ile iletişime geçin.'
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
        hizmetBitisTarihi: user.hizmetBitisTarihi,
        partnerCode: partner.partnerCode
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
    } else if (decoded.role === 'partner') {
      user = await Partner.findById(decoded.id).select('-password');
      if (user) {
        user = user.toObject();
        user.role = 'partner';
      }
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

// Partner Login
router.post('/partner/login', async (req, res) => {
  try {
    const { partnerCode, username, password } = req.body;

    if (!partnerCode || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Partner kodu, kullanıcı adı ve şifre gereklidir'
      });
    }

    // Partner'ı bul (partnerCode + username)
    const partner = await Partner.findOne({
      partnerCode: partnerCode.toLowerCase(),
      username
    });

    if (!partner) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz partner kodu, kullanıcı adı veya şifre'
      });
    }

    // Aktif mi kontrol et
    if (!partner.aktif) {
      return res.status(403).json({
        success: false,
        message: 'Partner hesabınız pasif durumda. Destek için https://mrtek.com.tr ile iletişime geçin.'
      });
    }

    // Hizmet bitiş tarihi kontrolü
    if (partner.hizmetBitisTarihi && new Date(partner.hizmetBitisTarihi) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Hizmet süreniz sona ermiştir. Destek için https://mrtek.com.tr ile iletişime geçin.'
      });
    }

    // Şifre kontrolü
    const isMatch = await partner.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz partner kodu, kullanıcı adı veya şifre'
      });
    }

    // Son giriş tarihini güncelle
    partner.kullanimIstatistikleri.sonGirisTarihi = new Date();
    await partner.save();

    // Session kaydı oluştur
    const { deviceId, deviceName, browserInfo } = req.body;
    if (deviceId) {
      await PartnerSession.findOneAndUpdate(
        { partnerId: partner._id, deviceId },
        {
          partnerId: partner._id,
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
      { id: partner._id, role: 'partner' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      user: {
        id: partner._id,
        partnerCode: partner.partnerCode,
        partnerName: partner.partnerName,
        username: partner.username,
        role: 'partner',
        hizmetBitisTarihi: partner.hizmetBitisTarihi
      }
    });
  } catch (error) {
    console.error('Partner login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Admin login as Partner
router.post('/admin-login-as-partner/:partnerId', protect, async (req, res) => {
  try {
    // Sadece admin yetkisi kontrol et
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gereklidir'
      });
    }

    const partner = await Partner.findById(req.params.partnerId);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner bulunamadı'
      });
    }

    const { deviceId, deviceName, browserInfo } = req.body;

    // Mevcut tüm partner session'larını deaktif et
    if (deviceId) {
      await PartnerSession.updateMany(
        { partnerId: partner._id },
        { aktif: false }
      );

      // Yeni session oluştur
      await PartnerSession.findOneAndUpdate(
        { partnerId: partner._id, deviceId },
        {
          partnerId: partner._id,
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

    // JWT token oluştur
    const token = jwt.sign(
      { id: partner._id, role: 'partner' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Partner objesini düzenle
    const partnerData = partner.toObject();
    partnerData.role = 'partner';
    delete partnerData.password;

    // Auto-login URL oluştur
    const autoLoginUrl = `http://localhost:13202/auto-login?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(partnerData))}&deviceId=${deviceId || ''}`;

    res.json({
      success: true,
      token,
      user: partnerData,
      partnerPanelUrl: autoLoginUrl,
      message: 'Admin olarak partner hesabına giriş yapıldı'
    });
  } catch (error) {
    console.error('Admin login as partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Partner login as Customer
router.post('/partner-login-as-customer/:customerId', protect, async (req, res) => {
  try {
    // Partner yetkisi kontrol et
    if (req.user.role !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için partner yetkisi gereklidir'
      });
    }

    const customer = await Customer.findById(req.params.customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
      });
    }

    // Customer bu partnera ait mi kontrol et
    if (customer.partnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu müşteriye erişim yetkiniz yok'
      });
    }

    const { deviceId, deviceName, browserInfo } = req.body;

    // Mevcut tüm customer session'larını deaktif et
    if (deviceId) {
      await CustomerSession.updateMany(
        { customerId: customer._id },
        { aktif: false }
      );

      // Yeni session oluştur
      await CustomerSession.findOneAndUpdate(
        { customerId: customer._id, deviceId },
        {
          customerId: customer._id,
          deviceId,
          deviceName: deviceName || 'Partner Panel',
          browserInfo: browserInfo || 'Partner Connection',
          ipAddress: req.ip,
          lastActivity: new Date(),
          aktif: true
        },
        { upsert: true, new: true }
      );
    }

    // JWT token oluştur
    const token = jwt.sign(
      { id: customer._id, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Customer objesini düzenle
    const customerData = customer.toObject();
    customerData.role = 'customer';
    delete customerData.password;

    // Auto-login URL oluştur
    const autoLoginUrl = `http://localhost:13203/auto-login?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(customerData))}&deviceId=${deviceId || ''}`;

    res.json({
      success: true,
      token,
      user: customerData,
      clientUrl: autoLoginUrl,
      message: 'Partner olarak müşteri hesabına giriş yapıldı'
    });
  } catch (error) {
    console.error('Partner login as customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
