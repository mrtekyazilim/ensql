const express = require('express')
const router = express.Router()
const AdminSession = require('../models/AdminSession')
const CustomerSession = require('../models/CustomerSession')
const { protect } = require('../middleware/auth')

// Kullanıcının aktif oturumlarını getir
router.get('/', protect, async (req, res) => {
  try {
    let sessions;

    // Role'e göre doğru session modelini kullan
    if (req.user.role === 'admin' || req.user.role === 'user') {
      sessions = await AdminSession.find({
        adminUserId: req.user._id,
        aktif: true
      }).sort({ lastActivity: -1 })
    } else {
      sessions = await CustomerSession.find({
        customerId: req.user._id,
        aktif: true
      }).sort({ lastActivity: -1 })
    }

    res.json({
      success: true,
      sessions
    })
  } catch (error) {
    console.error('Sessions fetch error:', error)
    res.status(500).json({
      success: false,
      message: 'Oturumlar getirilirken hata oluştu'
    })
  }
})

// Belirli bir oturumu kapat
router.delete('/:sessionId', protect, async (req, res) => {
  try {
    let session;

    // Role'e göre doğru session modelini kullan
    if (req.user.role === 'admin' || req.user.role === 'user') {
      session = await AdminSession.findOne({
        _id: req.params.sessionId,
        adminUserId: req.user._id
      })
    } else {
      session = await CustomerSession.findOne({
        _id: req.params.sessionId,
        customerId: req.user._id
      })
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Oturum bulunamadı'
      })
    }

    session.aktif = false
    await session.save()

    res.json({
      success: true,
      message: 'Oturum kapatıldı'
    })
  } catch (error) {
    console.error('Session delete error:', error)
    res.status(500).json({
      success: false,
      message: 'Oturum kapatılırken hata oluştu'
    })
  }
})

// Son aktivite güncelleme
router.put('/activity', protect, async (req, res) => {
  try {
    const { deviceId } = req.body

    // Role'e göre doğru session modelini kullan
    if (req.user.role === 'admin' || req.user.role === 'user') {
      await AdminSession.updateOne(
        {
          adminUserId: req.user._id,
          deviceId,
          aktif: true
        },
        {
          lastActivity: new Date()
        }
      )
    } else {
      await CustomerSession.updateOne(
        {
          customerId: req.user._id,
          deviceId,
          aktif: true
        },
        {
          lastActivity: new Date()
        }
      )
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Activity update error:', error)
    res.status(500).json({ success: false })
  }
})

// Aktif connector güncelleme (sadece customer için)
router.put('/active-connector', protect, async (req, res) => {
  try {
    const { deviceId, connectorId } = req.body

    console.log('Active connector update request:', {
      userId: req.user._id,
      userRole: req.user.role,
      deviceId,
      connectorId
    })

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId gereklidir'
      })
    }

    // Sadece customer'lar connector kullanabilir
    if (req.user.role === 'admin' || req.user.role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem sadece müşteriler için geçerlidir'
      })
    }

    const session = await CustomerSession.findOne({
      customerId: req.user._id,
      deviceId,
      aktif: true
    })

    console.log('Found session:', session ? { id: session._id, customerId: session.customerId } : 'NOT FOUND')

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Oturum bulunamadı'
      })
    }

    session.activeConnectorId = connectorId || null
    session.lastActivity = new Date()
    await session.save()

    console.log('Session updated with activeConnectorId:', connectorId)

    res.json({
      success: true,
      message: 'Aktif connector güncellendi'
    })
  } catch (error) {
    console.error('Active connector update error:', error)
    res.status(500).json({
      success: false,
      message: 'Aktif connector güncellenirken hata oluştu'
    })
  }
})

module.exports = router
