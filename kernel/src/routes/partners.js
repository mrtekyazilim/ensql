const express = require('express');
const router = express.Router();
const Partner = require('../models/Partner');
const Customer = require('../models/Customer');
const CustomerSession = require('../models/CustomerSession');
const Report = require('../models/Report');
const Connector = require('../models/Connector');
const Activity = require('../models/Activity');
const { protect, adminOnly } = require('../middleware/auth');

// List all partners (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const partners = await Partner.find()
      .select('-password')
      .sort({ createdAt: -1 });

    // Her partner için müşteri sayısı hesapla
    const partnersWithCustomerCount = await Promise.all(
      partners.map(async (partner) => {
        const customerCount = await Customer.countDocuments({ partnerId: partner._id });
        const partnerObj = partner.toObject();
        partnerObj.customerCount = customerCount;
        return partnerObj;
      })
    );

    res.json({
      success: true,
      count: partnersWithCustomerCount.length,
      partners: partnersWithCustomerCount
    });
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get partner detail (admin only)
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id).select('-password');

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner bulunamadı'
      });
    }

    // Müşteri sayısı ekle
    const customerCount = await Customer.countDocuments({ partnerId: partner._id });
    const partnerObj = partner.toObject();
    partnerObj.customerCount = customerCount;

    res.json({
      success: true,
      partner: partnerObj
    });
  } catch (error) {
    console.error('Get partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get partner's customers (admin only)
router.get('/:id/customers', protect, adminOnly, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner bulunamadı'
      });
    }

    // Partnera ait müşterileri getir
    const customers = await Customer.find({ partnerId: partner._id })
      .select('-password')
      .sort({ createdAt: -1 });

    // Her müşteri için istatistikler ekle
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const reportCount = await Report.countDocuments({ customerId: customer._id });
        const connectorCount = await Connector.countDocuments({ customerId: customer._id });
        const customerObj = customer.toObject();
        customerObj.reportCount = reportCount;
        customerObj.connectorCount = connectorCount;
        return customerObj;
      })
    );

    res.json({
      success: true,
      count: customersWithStats.length,
      customers: customersWithStats,
      partner: {
        id: partner._id,
        partnerCode: partner.partnerCode,
        partnerName: partner.partnerName
      }
    });
  } catch (error) {
    console.error('Get partner customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Create partner (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { partnerCode, partnerName, username, password, hizmetBitisTarihi, iletisimBilgileri } = req.body;

    if (!partnerCode || !partnerName || !username || !password || !hizmetBitisTarihi) {
      return res.status(400).json({
        success: false,
        message: 'Partner kodu, partner adı, kullanıcı adı, şifre ve hizmet bitiş tarihi gereklidir'
      });
    }

    // PartnerCode validation (küçük harf, rakam ve tire)
    const cleanPartnerCode = partnerCode.toLowerCase().trim();
    if (!/^[a-z0-9-]+$/.test(cleanPartnerCode)) {
      return res.status(400).json({
        success: false,
        message: 'Partner kodu sadece küçük harf, rakam ve tire (-) içerebilir'
      });
    }

    // PartnerCode + username unique kontrolü
    const existingPartner = await Partner.findOne({
      partnerCode: cleanPartnerCode,
      username
    });

    if (existingPartner) {
      return res.status(400).json({
        success: false,
        message: 'Bu partner kodu ve kullanıcı adı kombinasyonu zaten kullanılıyor'
      });
    }

    const partner = await Partner.create({
      partnerCode: cleanPartnerCode,
      partnerName,
      username,
      password,
      hizmetBitisTarihi,
      iletisimBilgileri: iletisimBilgileri || {}
    });

    res.status(201).json({
      success: true,
      partner: {
        id: partner._id,
        partnerCode: partner.partnerCode,
        partnerName: partner.partnerName,
        username: partner.username,
        hizmetBitisTarihi: partner.hizmetBitisTarihi,
        aktif: partner.aktif
      }
    });
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Sunucu hatası'
    });
  }
});

// Update partner (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner bulunamadı'
      });
    }

    const { partnerName, username, password, hizmetBitisTarihi, iletisimBilgileri, aktif } = req.body;

    // Güncellenebilir alanlar (partnerCode değiştirilemez!)
    if (partnerName) partner.partnerName = partnerName;
    if (username) partner.username = username;
    if (password) partner.password = password; // Pre-save middleware hash'leyecek
    if (hizmetBitisTarihi) partner.hizmetBitisTarihi = hizmetBitisTarihi;
    if (iletisimBilgileri) partner.iletisimBilgileri = iletisimBilgileri;
    if (typeof aktif !== 'undefined') {
      partner.aktif = aktif;

      // Partner pasif ediliyorsa, tüm müşteri oturumlarını kapat
      if (aktif === false) {
        const customers = await Customer.find({ partnerId: partner._id });
        const customerIds = customers.map(c => c._id);

        // Tüm müşteri oturumlarını kapat
        await CustomerSession.updateMany(
          { customerId: { $in: customerIds } },
          { aktif: false }
        );

        // Her müşteri için activity log oluştur
        for (const customer of customers) {
          await Activity.create({
            customerId: customer._id,
            customerName: customer.companyName || customer.username,
            action: 'force_logout',
            description: 'Partner pasif edildi - oturum otomatik kapatıldı',
            type: 'warning'
          });
        }
      }
    }

    await partner.save();

    res.json({
      success: true,
      partner: {
        id: partner._id,
        partnerCode: partner.partnerCode,
        partnerName: partner.partnerName,
        username: partner.username,
        hizmetBitisTarihi: partner.hizmetBitisTarihi,
        aktif: partner.aktif
      },
      message: aktif === false ? 'Partner pasif edildi ve tüm müşteri oturumları kapatıldı' : 'Partner güncellendi'
    });
  } catch (error) {
    console.error('Update partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Activate partner (admin only - requires partnerCode confirmation)
router.put('/:id/activate', protect, adminOnly, async (req, res) => {
  try {
    const { partnerCode } = req.body;

    if (!partnerCode) {
      return res.status(400).json({
        success: false,
        message: 'Partner kodu gereklidir'
      });
    }

    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner bulunamadı'
      });
    }

    // PartnerCode doğrulama
    if (partner.partnerCode !== partnerCode.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Partner kodu eşleşmiyor'
      });
    }

    partner.aktif = true;
    await partner.save();

    res.json({
      success: true,
      partner: {
        id: partner._id,
        partnerCode: partner.partnerCode,
        partnerName: partner.partnerName,
        aktif: partner.aktif
      },
      message: 'Partner aktifleştirildi'
    });
  } catch (error) {
    console.error('Activate partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
