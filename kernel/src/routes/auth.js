const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

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
    const user = await User.findOne({ username, role: 'admin' });

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
      await Session.findOneAndUpdate(
        { userId: user._id, deviceId },
        {
          userId: user._id,
          userType: 'admin',
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
    const user = await User.findOne({ username, role: 'client' });

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

    // Hizmet bitiş tarihi kontrolü
    if (user.hizmetBitisTarihi && new Date() > new Date(user.hizmetBitisTarihi)) {
      return res.status(403).json({
        success: false,
        message: 'Hizmet süreniz dolmuştur'
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

    // Session kaydı oluştur
    const { deviceId, deviceName, browserInfo } = req.body;
    if (deviceId) {
      await Session.findOneAndUpdate(
        { userId: user._id, deviceId },
        {
          userId: user._id,
          userType: 'client',
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
        role: user.role,
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
    const user = await User.findById(decoded.id).select('-password -clientPassword');

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

// Admin'in müşteri hesabına bağlanması için token oluştur
router.post('/admin-connect-client', protect, async (req, res) => {
  try {
    const { clientId } = req.body;

    // Sadece admin kullanıcılar bu endpoint'i kullanabilir
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gereklidir'
      });
    }

    // Client kullanıcısını bul
    const client = await User.findOne({ clientId, role: 'client' });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
      });
    }

    // Session kaydı oluştur
    const { deviceId, deviceName, browserInfo } = req.body;
    if (deviceId) {
      await Session.findOneAndUpdate(
        { userId: client._id, deviceId },
        {
          userId: client._id,
          userType: 'client',
          deviceId,
          deviceName: deviceName || 'Admin Bağlantısı',
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
      { id: client._id, role: client.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      user: {
        id: client._id,
        username: client.username,
        companyName: client.companyName,
        role: client.role,
        clientId: client.clientId,
        hizmetBitisTarihi: client.hizmetBitisTarihi
      }
    });
  } catch (error) {
    console.error('Admin connect client error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
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

    const user = await User.findById(req.user._id);

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

module.exports = router;
