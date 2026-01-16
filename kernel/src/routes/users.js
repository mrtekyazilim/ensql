const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Tüm kullanıcıları listele (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'client' })
      .select('-password -clientPassword')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı detayı
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -clientPassword');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Admin değilse sadece kendi bilgilerini görebilir
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Yeni kullanıcı oluştur (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { username, password, clientId, clientPassword, hizmetBitisTarihi, sqlServerConfig } = req.body;

    if (!username || !password || !clientId || !clientPassword || !hizmetBitisTarihi) {
      return res.status(400).json({
        success: false,
        message: 'Zorunlu alanları doldurun'
      });
    }

    // Kullanıcı adı kontrolü
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı zaten kullanılıyor'
      });
    }

    // ClientId kontrolü
    const existingClientId = await User.findOne({ clientId });
    if (existingClientId) {
      return res.status(400).json({
        success: false,
        message: 'Bu clientId zaten kullanılıyor'
      });
    }

    // ClientPassword hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedClientPassword = await bcrypt.hash(clientPassword, salt);

    const user = await User.create({
      username,
      password, // Model'de otomatik hash'lenir
      role: 'client',
      clientId,
      clientPassword: hashedClientPassword,
      hizmetBitisTarihi,
      sqlServerConfig,
      aktif: true
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        clientId: user.clientId,
        hizmetBitisTarihi: user.hizmetBitisTarihi,
        aktif: user.aktif
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı güncelle
router.put('/:id', protect, async (req, res) => {
  try {
    const { password, clientPassword, hizmetBitisTarihi, sqlServerConfig, aktif } = req.body;

    // Admin değilse sadece kendi bilgilerini güncelleyebilir
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Şifre güncelleme
    if (password) {
      user.password = password;
    }

    // ClientPassword güncelleme
    if (clientPassword) {
      const salt = await bcrypt.genSalt(10);
      user.clientPassword = await bcrypt.hash(clientPassword, salt);
    }

    // Diğer alanlar (sadece admin güncelleyebilir)
    if (req.user.role === 'admin') {
      if (hizmetBitisTarihi) user.hizmetBitisTarihi = hizmetBitisTarihi;
      if (aktif !== undefined) user.aktif = aktif;
    }

    if (sqlServerConfig) {
      user.sqlServerConfig = sqlServerConfig;
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        hizmetBitisTarihi: user.hizmetBitisTarihi,
        aktif: user.aktif
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanıcı sil (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'Kullanıcı silindi'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanım istatistikleri (admin only)
router.get('/:id/stats', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('kullanimIstatistikleri username');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      stats: user.kullanimIstatistikleri
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
