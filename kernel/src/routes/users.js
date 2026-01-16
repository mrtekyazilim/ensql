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
    const { companyName, username, password, hizmetBitisTarihi, sqlServerConfig } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı adı ve şifre gereklidir'
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

    // ClientId otomatik oluştur (UUID)
    const { randomUUID } = require('crypto');
    const clientId = randomUUID();
    const clientPassword = randomUUID(); // Otomatik güvenli şifre

    // Hizmet bitiş tarihi: gönderilmişse kullan, yoksa 2 ay sonrası
    let bitisTarihi;
    if (hizmetBitisTarihi) {
      bitisTarihi = new Date(hizmetBitisTarihi);
    } else {
      bitisTarihi = new Date();
      bitisTarihi.setMonth(bitisTarihi.getMonth() + 2);
    }

    // ClientPassword hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedClientPassword = await bcrypt.hash(clientPassword, salt);

    const user = await User.create({
      companyName,
      username,
      password, // Model'de otomatik hash'lenir
      role: 'client',
      clientId,
      clientPassword: hashedClientPassword,
      hizmetBitisTarihi: bitisTarihi,
      sqlServerConfig,
      aktif: true
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        companyName: user.companyName,
        username: user.username,
        clientId: user.clientId,
        clientPassword: clientPassword, // Sadece bu seferlik düz metin olarak dön (kaydetsin diye)
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

// Kullanıcı güncelle (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { companyName, username, password, hizmetBitisTarihi, sqlServerConfig, aktif } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Güncellenebilir alanlar
    if (companyName !== undefined) user.companyName = companyName;
    if (username) user.username = username;
    if (password) user.password = password; // Model'de otomatik hash'lenir
    if (hizmetBitisTarihi) user.hizmetBitisTarihi = hizmetBitisTarihi;
    if (sqlServerConfig) user.sqlServerConfig = sqlServerConfig;
    if (typeof aktif !== 'undefined') user.aktif = aktif;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        companyName: user.companyName,
        username: user.username,
        clientId: user.clientId,
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
