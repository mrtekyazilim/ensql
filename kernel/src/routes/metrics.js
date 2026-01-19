const express = require('express');
const router = express.Router();
const SystemMetrics = require('../models/SystemMetrics');
const CustomerSession = require('../models/CustomerSession');
const AdminSession = require('../models/AdminSession');
const { protect, adminOnly } = require('../middleware/auth');

// Sistem metriklerini getir (Admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Son 24 saatin ortalama yanıt süresi
    const avgResponseTime = await SystemMetrics.aggregate([
      {
        $match: {
          timestamp: { $gte: oneDayAgo },
          statusCode: { $lt: 400 } // Sadece başarılı istekler
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$responseTime' }
        }
      }
    ]);

    // Aktif oturum sayısı
    const activeCustomerSessions = await CustomerSession.countDocuments({
      aktif: true,
      lastActivity: { $gte: new Date(now.getTime() - 30 * 60 * 1000) } // Son 30 dakika
    });

    const activeAdminSessions = await AdminSession.countDocuments({
      aktif: true,
      lastActivity: { $gte: new Date(now.getTime() - 30 * 60 * 1000) } // Son 30 dakika
    });

    // İstek sayıları (son 24 saat)
    const totalRequests = await SystemMetrics.countDocuments({
      timestamp: { $gte: oneDayAgo }
    });

    const successfulRequests = await SystemMetrics.countDocuments({
      timestamp: { $gte: oneDayAgo },
      statusCode: { $lt: 400 }
    });

    const errorRequests = await SystemMetrics.countDocuments({
      timestamp: { $gte: oneDayAgo },
      statusCode: { $gte: 400 }
    });

    res.json({
      success: true,
      metrics: {
        averageResponseTime: avgResponseTime.length > 0
          ? Math.round(avgResponseTime[0].avgTime)
          : 0,
        activeSessions: activeCustomerSessions + activeAdminSessions,
        totalRequests24h: totalRequests,
        successfulRequests24h: successfulRequests,
        errorRequests24h: errorRequests,
        serverStatus: 'online'
      }
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
