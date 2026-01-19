const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { protect, adminOnly } = require('../middleware/auth');

// Tüm müşterileri listele (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const customers = await Customer.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: customers.length,
      customers
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Müşteri detayı
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
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
      customer
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Yeni müşteri oluştur (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { companyName, username, password, hizmetBitisTarihi, iletisimBilgileri } = req.body;

    if (!companyName || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Şirket adı, kullanıcı adı ve şifre gereklidir'
      });
    }

    // Kullanıcı adı kontrolü
    const existingCustomer = await Customer.findOne({ username });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı zaten kullanılıyor'
      });
    }

    // Hizmet bitiş tarihi: gönderilmişse kullan, yoksa 2 ay sonrası
    let bitisTarihi;
    if (hizmetBitisTarihi) {
      bitisTarihi = new Date(hizmetBitisTarihi);
    } else {
      bitisTarihi = new Date();
      bitisTarihi.setMonth(bitisTarihi.getMonth() + 2);
    }

    const customer = await Customer.create({
      companyName,
      username,
      password, // Model'de otomatik hash'lenir
      hizmetBitisTarihi: bitisTarihi,
      iletisimBilgileri: iletisimBilgileri || {},
      aktif: true
    });

    res.status(201).json({
      success: true,
      customer: {
        id: customer._id,
        companyName: customer.companyName,
        username: customer.username,
        hizmetBitisTarihi: customer.hizmetBitisTarihi,
        aktif: customer.aktif
      }
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Müşteri güncelle (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { companyName, username, password, hizmetBitisTarihi, aktif, iletisimBilgileri } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
      });
    }

    // Güncellenebilir alanlar
    if (companyName !== undefined) customer.companyName = companyName;
    if (username) customer.username = username;
    if (password) customer.password = password; // Model'de otomatik hash'lenir
    if (hizmetBitisTarihi) customer.hizmetBitisTarihi = hizmetBitisTarihi;
    if (typeof aktif !== 'undefined') customer.aktif = aktif;
    if (iletisimBilgileri !== undefined) customer.iletisimBilgileri = iletisimBilgileri;

    await customer.save();

    res.json({
      success: true,
      customer: {
        id: customer._id,
        companyName: customer.companyName,
        username: customer.username,
        hizmetBitisTarihi: customer.hizmetBitisTarihi,
        aktif: customer.aktif
      }
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Müşteri sil (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
      });
    }

    await customer.deleteOne();

    res.json({
      success: true,
      message: 'Müşteri silindi'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kullanım istatistikleri (admin only)
router.get('/:id/stats', protect, adminOnly, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('kullanimIstatistikleri username companyName');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
      });
    }

    res.json({
      success: true,
      stats: customer.kullanimIstatistikleri
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
