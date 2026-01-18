const express = require('express');
const router = express.Router();
const axios = require('axios');
const Report = require('../models/Report');
const Customer = require('../models/Customer');
const CustomerSession = require('../models/CustomerSession');
const { protect, adminOnly } = require('../middleware/auth');

// Kullanıcının raporlarını listele
router.get('/', protect, async (req, res) => {
  try {
    // includeInactive parametresi ile tüm raporları gösterme seçeneği (rapor tasarım sayfası için)
    const includeInactive = req.query.includeInactive === 'true';

    let query = {};

    // Normal liste için sadece aktif raporları getir
    if (!includeInactive) {
      query.aktif = true;
    }

    // Admin tüm raporları görebilir, client sadece kendi raporlarını
    if (req.user.role !== 'admin') {
      query.customerId = req.user.id;
    }

    const reports = await Report.find(query)
      .populate('customerId', 'username')
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
    const report = await Report.findById(req.params.id).populate('customerId', 'username');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    // Admin değilse sadece kendi raporunu görebilir
    if (req.user.role !== 'admin' && report.customerId._id.toString() !== req.user.id) {
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
    const { raporAdi, aciklama, icon, raporTuru, sqlSorgusu, showDate1, showDate2, showSearch, parametreler, goruntuAyarlari, aktif } = req.body;

    if (!raporAdi || !sqlSorgusu) {
      return res.status(400).json({
        success: false,
        message: 'Rapor adı ve SQL sorgusu gereklidir'
      });
    }

    const report = await Report.create({
      customerId: req.user.id,
      raporAdi,
      aciklama,
      icon,
      raporTuru: raporTuru || 'normal-report',
      sqlSorgusu,
      showDate1: showDate1 || false,
      showDate2: showDate2 || false,
      showSearch: showSearch || false,
      parametreler,
      goruntuAyarlari,
      aktif: aktif !== undefined ? aktif : true
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
    if (req.user.role !== 'admin' && report.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu raporu güncelleme yetkiniz yok'
      });
    }

    const { raporAdi, aciklama, icon, raporTuru, sqlSorgusu, showDate1, showDate2, showSearch, parametreler, goruntuAyarlari, aktif } = req.body;

    if (raporAdi) report.raporAdi = raporAdi;
    if (aciklama !== undefined) report.aciklama = aciklama;
    if (icon !== undefined) report.icon = icon;
    if (raporTuru) report.raporTuru = raporTuru;
    if (sqlSorgusu) report.sqlSorgusu = sqlSorgusu;
    if (showDate1 !== undefined) report.showDate1 = showDate1;
    if (showDate2 !== undefined) report.showDate2 = showDate2;
    if (showSearch !== undefined) report.showSearch = showSearch;
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
    if (req.user.role !== 'admin' && report.customerId.toString() !== req.user.id) {
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

// Rapor çalıştır (SQL sorgusu çalıştırma - ConnectorAbi integration)
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
    if (req.user.role !== 'admin' && report.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu raporu çalıştırma yetkiniz yok'
      });
    }

    // Get parameters from request body
    const { date1, date2, search, sqlQuery } = req.body;

    console.log('Report execute request for user:', {
      userId: req.user.id,
      reportId: req.params.id
    })

    // Find active session with connector info
    const session = await CustomerSession.findOne({
      customerId: req.user.id,
      aktif: true
    }).populate('activeConnectorId');

    console.log('Session found:', session ? {
      sessionId: session._id,
      customerId: session.customerId,
      deviceId: session.deviceId,
      activeConnectorId: session.activeConnectorId,
      activeConnectorPopulated: !!session.activeConnectorId
    } : 'NOT FOUND')

    if (!session || !session.activeConnectorId) {
      console.error('Session or connector missing:', {
        sessionExists: !!session,
        activeConnectorId: session?.activeConnectorId
      })
      return res.status(400).json({
        success: false,
        message: 'Aktif connector bulunamadı. Lütfen önce bir connector seçin.'
      });
    }

    const connector = session.activeConnectorId;

    // Prepare SQL config from connector
    const config = {
      user: connector.sqlServerConfig.user,
      password: connector.sqlServerConfig.password,
      database: connector.sqlServerConfig.database,
      server: connector.sqlServerConfig.server,
      port: connector.sqlServerConfig.port || 1433,
      dialect: 'mssql',
      dialectOptions: { instanceName: '' },
      options: { encrypt: false, trustServerCertificate: true }
    };

    // Use provided sqlQuery or report's default query
    const queryToRun = sqlQuery || report.sqlSorgusu;

    // Debug: Log the query being executed
    console.log('\n========== SQL QUERY DEBUG ==========');
    console.log('Original Query:', report.sqlSorgusu);
    console.log('Parameters:', { date1, date2, search });
    console.log('Query to Run:', queryToRun);
    console.log('=====================================\n');

    // Call ConnectorAbi /mssql endpoint
    const connectorResponse = await axios.post(
      'https://kernel.connectorabi.com/api/v1/mssql',
      {
        clientId: connector.clientId,
        clientPass: connector.clientPassword, // Plain text password
        config: config,
        query: queryToRun
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'clientId': connector.clientId,
          'clientPass': connector.clientPassword
        },
        timeout: 30000
      }
    );

    // Extract results from ConnectorAbi response
    const results = connectorResponse.data?.data?.recordsets?.[0] || [];

    // Update usage statistics
    report.kullanimSayisi += 1;
    report.sonKullanimTarihi = new Date();
    await report.save();

    // Update customer statistics
    const customer = await Customer.findById(req.user.id);
    if (customer) {
      customer.kullanimIstatistikleri.toplamSorguSayisi += 1;
      await customer.save();
    }

    res.json({
      success: true,
      message: 'Rapor başarıyla çalıştırıldı',
      data: results,
      metadata: {
        raporAdi: report.raporAdi,
        calistirilmaTarihi: new Date(),
        kullanimSayisi: report.kullanimSayisi,
        kayitSayisi: results.length
      }
    });
  } catch (error) {
    console.error('Execute report error:', error);

    // Handle ConnectorAbi errors
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.message || 'ConnectorAbi hatası',
        error: error.response.data
      });
    }

    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + error.message
    });
  }
});

module.exports = router;
