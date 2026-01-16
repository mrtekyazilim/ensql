const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

module.exports = router;
