const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { protect, adminOnly } = require('../middleware/auth');

// Son aktiviteleri listele (Admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'companyName username')
      .populate('reportId', 'raporAdi');

    const total = await Activity.countDocuments();

    res.json({
      success: true,
      count: activities.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Belirli bir müşterinin aktivitelerini listele
router.get('/customer/:customerId', protect, async (req, res) => {
  try {
    // Admin değilse sadece kendi aktivitelerini görebilir
    if (req.user.role !== 'admin' && req.user.id !== req.params.customerId) {
      return res.status(403).json({
        success: false,
        message: 'Bu aktiviteleri görme yetkiniz yok'
      });
    }

    const limit = parseInt(req.query.limit) || 50;
    const activities = await Activity.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('reportId', 'raporAdi');

    res.json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    console.error('Get customer activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Aktivite oluştur (internal use - diğer route'lardan çağrılacak)
const createActivity = async (data) => {
  try {
    const activity = new Activity(data);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Create activity error:', error);
  }
};

module.exports = router;
module.exports.createActivity = createActivity;
