const express = require('express')
const router = express.Router()
const Session = require('../models/Session')
const { protect } = require('../middleware/auth')

// Kullanıcının aktif oturumlarını getir
router.get('/', protect, async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.user._id,
      aktif: true
    }).sort({ lastActivity: -1 })

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
    const session = await Session.findOne({
      _id: req.params.sessionId,
      userId: req.user._id
    })

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

    await Session.updateOne(
      {
        userId: req.user._id,
        deviceId,
        aktif: true
      },
      {
        lastActivity: new Date()
      }
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Activity update error:', error)
    res.status(500).json({ success: false })
  }
})

module.exports = router
