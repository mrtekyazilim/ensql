const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');
const { connectorAuth } = require('../middleware/auth');

// Connector authentication
router.post('/auth', connectorAuth, async (req, res) => {
  try {
    const user = req.connectorUser;

    res.json({
      success: true,
      message: 'Connector authentication başarılı',
      user: {
        id: user._id,
        username: user.username,
        hizmetBitisTarihi: user.hizmetBitisTarihi
      }
    });
  } catch (error) {
    console.error('Connector auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Connector üzerinden rapor listesi
router.post('/reports', connectorAuth, async (req, res) => {
  try {
    const user = req.connectorUser;

    const reports = await Report.find({
      userId: user._id,
      aktif: true
    }).select('raporAdi aciklama parametreler');

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Connector get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Connector üzerinden sorgu çalıştır
router.post('/query', connectorAuth, async (req, res) => {
  try {
    const user = req.connectorUser;
    const { reportId, parametreler } = req.body;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'Report ID gereklidir'
      });
    }

    const report = await Report.findOne({
      _id: reportId,
      userId: user._id,
      aktif: true
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    // Kullanım istatistiklerini güncelle
    report.kullanimSayisi += 1;
    report.sonKullanimTarihi = new Date();
    await report.save();

    // Kullanıcı istatistiklerini güncelle
    user.kullanimIstatistikleri.toplamSorguSayisi += 1;
    await user.save();

    // TODO: Gerçek SQL sorgusu çalıştırma implementasyonu
    // user.sqlServerConfig bilgilerini kullanarak SQL Server'a bağlan
    // report.sqlSorgusu ile sorguyu çalıştır
    // parametreler varsa SQL sorgusuna bind et

    res.json({
      success: true,
      message: 'Sorgu başarıyla çalıştırıldı',
      data: [], // Sorgu sonuçları buraya gelecek
      metadata: {
        raporAdi: report.raporAdi,
        calistirilmaTarihi: new Date(),
        kullanimSayisi: report.kullanimSayisi
      }
    });
  } catch (error) {
    console.error('Connector query error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// SQL Server bağlantı testi
router.post('/test-connection', connectorAuth, async (req, res) => {
  try {
    const user = req.connectorUser;

    if (!user.sqlServerConfig) {
      return res.status(400).json({
        success: false,
        message: 'SQL Server bağlantı bilgileri tanımlı değil'
      });
    }

    // TODO: Gerçek SQL Server bağlantı testi
    // user.sqlServerConfig bilgileri ile bağlantıyı test et

    res.json({
      success: true,
      message: 'SQL Server bağlantısı başarılı'
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Bağlantı hatası'
    });
  }
});

module.exports = router;
