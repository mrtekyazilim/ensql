const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// Kullanıcının raporlarını listele
router.get('/', protect, async (req, res) => {
  try {
    let query = { aktif: true };

    // Admin tüm raporları görebilir, client sadece kendi raporlarını
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }

    const reports = await Report.find(query)
      .populate('userId', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Rapor detayı
router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('userId', 'username');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    // Admin değilse sadece kendi raporunu görebilir
    if (req.user.role !== 'admin' && report.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu raporu görüntüleme yetkiniz yok'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Yeni rapor oluştur
router.post('/', protect, async (req, res) => {
  try {
    const { raporAdi, aciklama, sqlSorgusu, parametreler, goruntuAyarlari } = req.body;

    if (!raporAdi || !sqlSorgusu) {
      return res.status(400).json({
        success: false,
        message: 'Rapor adı ve SQL sorgusu gereklidir'
      });
    }

    const report = await Report.create({
      userId: req.user.id,
      raporAdi,
      aciklama,
      sqlSorgusu,
      parametreler,
      goruntuAyarlari,
      aktif: true
    });

    res.status(201).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Rapor güncelle
router.put('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    // Admin değilse sadece kendi raporunu güncelleyebilir
    if (req.user.role !== 'admin' && report.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu raporu güncelleme yetkiniz yok'
      });
    }

    const { raporAdi, aciklama, sqlSorgusu, parametreler, goruntuAyarlari, aktif } = req.body;

    if (raporAdi) report.raporAdi = raporAdi;
    if (aciklama !== undefined) report.aciklama = aciklama;
    if (sqlSorgusu) report.sqlSorgusu = sqlSorgusu;
    if (parametreler) report.parametreler = parametreler;
    if (goruntuAyarlari) report.goruntuAyarlari = goruntuAyarlari;
    if (aktif !== undefined) report.aktif = aktif;

    await report.save();

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Rapor sil
router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    // Admin değilse sadece kendi raporunu silebilir
    if (req.user.role !== 'admin' && report.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu raporu silme yetkiniz yok'
      });
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Rapor silindi'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Rapor çalıştır (SQL sorgusu çalıştırma - placeholder)
router.post('/:id/execute', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    // Admin değilse sadece kendi raporunu çalıştırabilir
    if (req.user.role !== 'admin' && report.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu raporu çalıştırma yetkiniz yok'
      });
    }

    // Kullanım istatistiklerini güncelle
    report.kullanimSayisi += 1;
    report.sonKullanimTarihi = new Date();
    await report.save();

    // Kullanıcı istatistiklerini güncelle
    const user = await User.findById(req.user.id);
    if (user) {
      user.kullanimIstatistikleri.toplamSorguSayisi += 1;
      await user.save();
    }

    // TODO: Gerçek SQL sorgusu çalıştırma implementasyonu
    // Bu kısımda kullanıcının SQL Server bağlantı bilgileri ile sorgu çalıştırılacak

    res.json({
      success: true,
      message: 'Rapor çalıştırıldı',
      data: [], // Sorgu sonuçları buraya gelecek
      metadata: {
        raporAdi: report.raporAdi,
        calistirilmaTarihi: new Date(),
        kullanimSayisi: report.kullanimSayisi
      }
    });
  } catch (error) {
    console.error('Execute report error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
