const express = require('express');
const router = express.Router();
const axios = require('axios');
const Report = require('../models/Report');
const CustomerSession = require('../models/CustomerSession');
const { protect } = require('../middleware/auth');
const { createActivity } = require('./activities');

// Parametre çıkarımı fonksiyonu
function extractParameters(message) {
  const lowerMessage = message.toLowerCase();
  const params = {
    date1: null,
    date2: null,
    search: null
  };

  // Tarih ifadeleri için bugünün tarihi
  const today = new Date();
  const formatDate = (date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Bugün
  if (lowerMessage.includes('bugün') || lowerMessage.includes('bugun')) {
    params.date1 = formatDate(today);
    params.date2 = formatDate(today);
  }
  // Dün
  else if (lowerMessage.includes('dün') || lowerMessage.includes('dun')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    params.date1 = formatDate(yesterday);
    params.date2 = formatDate(yesterday);
  }
  // Bu hafta
  else if (lowerMessage.includes('bu hafta') || lowerMessage.includes('bu haftanın') || lowerMessage.includes('bu haftanin')) {
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    params.date1 = formatDate(monday);
    params.date2 = formatDate(today);
  }
  // Geçen hafta
  else if (lowerMessage.includes('geçen hafta') || lowerMessage.includes('gecen hafta')) {
    const dayOfWeek = today.getDay();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    params.date1 = formatDate(lastMonday);
    params.date2 = formatDate(lastSunday);
  }
  // Bu ay
  else if (lowerMessage.includes('bu ay') || lowerMessage.includes('bu ayin') || lowerMessage.includes('bu ayın')) {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    params.date1 = formatDate(firstDay);
    params.date2 = formatDate(today);
  }
  // Geçen ay
  else if (lowerMessage.includes('geçen ay') || lowerMessage.includes('gecen ay')) {
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    params.date1 = formatDate(firstDay);
    params.date2 = formatDate(lastDay);
  }
  // Son 3 ay
  else if (lowerMessage.includes('son 3 ay') || lowerMessage.includes('son uc ay') || lowerMessage.includes('son üç ay')) {
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    params.date1 = formatDate(threeMonthsAgo);
    params.date2 = formatDate(today);
  }
  // Son 6 ay
  else if (lowerMessage.includes('son 6 ay') || lowerMessage.includes('son alti ay') || lowerMessage.includes('son altı ay')) {
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    params.date1 = formatDate(sixMonthsAgo);
    params.date2 = formatDate(today);
  }
  // Bu yıl
  else if (lowerMessage.includes('bu yıl') || lowerMessage.includes('bu yil')) {
    const firstDay = new Date(today.getFullYear(), 0, 1);
    params.date1 = formatDate(firstDay);
    params.date2 = formatDate(today);
  }
  // Son 1 yıl
  else if (lowerMessage.includes('son 1 yıl') || lowerMessage.includes('son 1 yil') || lowerMessage.includes('son bir yıl') || lowerMessage.includes('son bir yil')) {
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    params.date1 = formatDate(oneYearAgo);
    params.date2 = formatDate(today);
  }
  // Yıl belirtilmişse (örn: "2024")
  else {
    const yearMatch = lowerMessage.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      params.date1 = `${year}-01-01`;
      params.date2 = `${year}-12-31`;
    }
  }

  // Search parametresi - "içinde X geçen" ifadelerini yakala
  const searchPatterns = [
    /içinde\s+["']?([^"']+)["']?\s+geçen/i,
    /icinde\s+["']?([^"']+)["']?\s+gecen/i,
    /["']([^"']+)["']\s+(olan|içeren|iceren)/i,
    /\b([A-ZÇĞİÖŞÜa-zçğıöşü]{3,})\s+adlı/i,
    /\b([A-ZÇĞİÖŞÜa-zçğıöşü]{3,})\s+isimli/i
  ];

  for (const pattern of searchPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      params.search = match[1].trim();
      break;
    }
  }

  return params;
}

// Chat ask endpoint
router.post('/ask', protect, async (req, res) => {
  try {
    const { message, reportId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mesaj gereklidir'
      });
    }

    // 1. Parametreleri çıkar
    const extractedParams = extractParameters(message);

    let report;

    // Eğer reportId verilmişse, direkt o raporu kullan (öneri butonundan geliyorsa)
    if (reportId) {
      report = await Report.findById(reportId);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Rapor bulunamadı'
        });
      }

      // Yetki kontrolü
      if (req.user.role !== 'admin' && report.customerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Bu rapora erişim yetkiniz yok'
        });
      }
    } else {
      // 2. Mesajdan rapor bul (normal chat akışı)
      const searchQuery = message.trim().toLowerCase();

      // Türkçe karakterleri normalize et
      const turkishMap = {
        'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
        'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
      };
      const normalizedQuery = searchQuery.replace(/[çğıöşüÇĞİÖŞÜ]/g, letter => turkishMap[letter] || letter);

      // Stopwords
      const stopwords = ['bir', 'bu', 've', 'veya', 'ile', 'için', 'mi', 'mı', 'mu', 'mü', 'ne', 'nedir', 'olan', 'göster', 'ver', 'getir', 'içinde', 'icinde', 'geçen', 'gecen'];
      const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 2 && !stopwords.includes(word));

      // Kullanıcının raporlarını getir
      let filter = { aktif: true };
      if (req.user.role !== 'admin') {
        filter.customerId = req.user.id;
      }

      const reports = await Report.find(filter);

      // Rapor skorlama
      const scoredReports = reports.map(report => {
        let score = 0;
        const raporAdiNormalized = report.raporAdi.toLowerCase().replace(/[çğıöşüÇĞİÖŞÜ]/g, letter => turkishMap[letter] || letter);
        const aciklamaNormalized = (report.aciklama || '').toLowerCase().replace(/[çğıöşüÇĞİÖŞÜ]/g, letter => turkishMap[letter] || letter);

        // Başlık (5x)
        queryWords.forEach(word => {
          if (raporAdiNormalized.includes(word)) score += 5;
        });

        // Anahtar kelime (3x)
        if (report.anahtarKelimeler && report.anahtarKelimeler.length > 0) {
          report.anahtarKelimeler.forEach(keyword => {
            const keywordNormalized = keyword.toLowerCase().replace(/[çğıöşüÇĞİÖŞÜ]/g, letter => turkishMap[letter] || letter);
            queryWords.forEach(word => {
              if (keywordNormalized.includes(word) || word.includes(keywordNormalized)) score += 3;
            });
          });
        }

        // Açıklama (1x)
        queryWords.forEach(word => {
          if (aciklamaNormalized.includes(word)) score += 1;
        });

        // Kategori (2x)
        if (report.kategori) {
          const kategoriNormalized = report.kategori.toLowerCase().replace(/[çğıöşüÇĞİÖŞÜ]/g, letter => turkishMap[letter] || letter);
          queryWords.forEach(word => {
            if (kategoriNormalized.includes(word)) score += 2;
          });
        }

        return { report, matchScore: score };
      });

      // En yüksek skorlu rapor
      const sortedReports = scoredReports
        .filter(r => r.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

      if (sortedReports.length === 0) {
        return res.json({
          success: false,
          message: 'Üzgünüm, sorgunuzla eşleşen bir rapor bulamadım. Lütfen farklı kelimeler deneyin.',
          suggestions: reports.slice(0, 3).map(r => ({
            _id: r._id,
            raporAdi: r.raporAdi,
            aciklama: r.aciklama,
            kategori: r.kategori
          }))
        });
      }

      const bestMatch = sortedReports[0];
      const isAmbiguous = sortedReports.length > 1 && sortedReports[1].matchScore >= bestMatch.matchScore * 0.7;

      // Belirsizlik durumu
      if (isAmbiguous) {
        return res.json({
          success: false,
          ambiguous: true,
          message: 'Birden fazla rapor buldum. Hangisini çalıştırmamı istersiniz?',
          suggestions: sortedReports.slice(0, 3).map(r => ({
            _id: r.report._id,
            raporAdi: r.report.raporAdi,
            aciklama: r.report.aciklama,
            kategori: r.report.kategori,
            matchScore: r.matchScore
          }))
        });
      }

      report = bestMatch.report;
    }

    // 3. Raporu çalıştır
    // Aktif connector'ı bul
    const session = await CustomerSession.findOne({
      customerId: req.user.id,
      aktif: true
    }).populate('activeConnectorId');

    if (!session || !session.activeConnectorId) {
      return res.status(400).json({
        success: false,
        message: 'Aktif connector bulunamadı. Lütfen ayarlardan bir connector seçin.'
      });
    }

    const connector = session.activeConnectorId;

    // SQL sorgusunu hazırla
    let sqlQuery = report.sqlSorgusu;

    // Parametreleri yerine koy
    if (extractedParams.date1) {
      sqlQuery = sqlQuery.replace(/@date1/g, `'${extractedParams.date1}'`);
    } else {
      sqlQuery = sqlQuery.replace(/@date1/g, "''");
    }

    if (extractedParams.date2) {
      sqlQuery = sqlQuery.replace(/@date2/g, `'${extractedParams.date2}'`);
    } else {
      sqlQuery = sqlQuery.replace(/@date2/g, "''");
    }

    if (extractedParams.search) {
      const escapedSearch = extractedParams.search.replace(/'/g, "''");
      sqlQuery = sqlQuery.replace(/@search/g, `'${escapedSearch}'`);
    } else {
      sqlQuery = sqlQuery.replace(/@search/g, "''");
    }

    // ConnectorAbi'ye istek gönder
    const config = {
      user: connector.sqlServerConfig.user,
      password: connector.sqlServerConfig.password,
      database: connector.sqlServerConfig.database,
      server: connector.sqlServerConfig.server,
      port: connector.sqlServerConfig.port || 1433,
      dialect: 'mssql',
      dialectOptions: { instanceName: connector.sqlServerConfig.instanceName || '' },
      options: {
        encrypt: connector.sqlServerConfig.encrypt !== undefined ? connector.sqlServerConfig.encrypt : false,
        trustServerCertificate: connector.sqlServerConfig.trustServerCertificate !== undefined ? connector.sqlServerConfig.trustServerCertificate : true
      }
    };

    const connectorResponse = await axios.post(
      'https://kernel.connectorabi.com/api/v1/mssql',
      {
        clientId: connector.clientId,
        clientPass: connector.clientPassword,
        config: config,
        query: sqlQuery
      },
      { timeout: 30000 }
    );

    const results = connectorResponse.data?.data?.recordsets?.[0] || [];

    // Rapor istatistiklerini güncelle
    report.kullanimSayisi = (report.kullanimSayisi || 0) + 1;
    report.sonKullanimTarihi = new Date();
    await report.save();

    // Aktivite kaydet
    await createActivity(
      req.user.id,
      'report_executed',
      {
        raporId: report._id,
        raporAdi: report.raporAdi,
        kayitSayisi: results.length,
        chatMessage: message
      }
    );

    res.json({
      success: true,
      message: `"${report.raporAdi}" raporu çalıştırıldı.`,
      report: {
        _id: report._id,
        raporAdi: report.raporAdi,
        aciklama: report.aciklama,
        raporTuru: report.raporTuru,
        kategori: report.kategori
      },
      parameters: extractedParams,
      data: results,
      metadata: {
        kayitSayisi: results.length,
        calistirilmaTarihi: new Date(),
        kullanimSayisi: report.kullanimSayisi
      }
    });

  } catch (error) {
    console.error('Chat ask error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Rapor çalıştırılırken bir hata oluştu'
    });
  }
});

module.exports = router;
