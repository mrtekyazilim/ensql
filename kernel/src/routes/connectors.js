const express = require('express');
const router = express.Router();
const Connector = require('../models/Connector');
const { protect } = require('../middleware/auth');
const { randomUUID } = require('crypto');

// Kullanıcının tüm connector'larını listele
router.get('/', protect, async (req, res) => {
  try {
    const connectors = await Connector.find({ userId: req.user._id })
      .select('-clientPassword')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: connectors.length,
      connectors
    });
  } catch (error) {
    console.error('Get connectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Connector detayı
router.get('/:id', protect, async (req, res) => {
  try {
    const connector = await Connector.findById(req.params.id).select('-clientPassword');

    if (!connector) {
      return res.status(404).json({
        success: false,
        message: 'Connector bulunamadı'
      });
    }

    // Sadece kendi connector'ına erişebilir
    if (connector.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    res.json({
      success: true,
      connector
    });
  } catch (error) {
    console.error('Get connector error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Yeni connector oluştur
router.post('/', protect, async (req, res) => {
  try {
    const { connectorName, clientId: userClientId, clientPassword: userClientPassword, sqlServerConfig } = req.body;

    if (!connectorName) {
      return res.status(400).json({
        success: false,
        message: 'Connector adı gereklidir'
      });
    }

    if (!sqlServerConfig || !sqlServerConfig.server || !sqlServerConfig.database ||
      !sqlServerConfig.user || !sqlServerConfig.password) {
      return res.status(400).json({
        success: false,
        message: 'SQL Server bağlantı bilgileri eksik'
      });
    }

    // ClientId ve clientPassword kullanıcıdan geliyorsa kullan, yoksa otomatik oluştur
    const clientId = userClientId || randomUUID();
    const clientPassword = userClientPassword || randomUUID();

    const connector = await Connector.create({
      userId: req.user._id,
      connectorName,
      clientId,
      clientPassword, // Model'de otomatik hash'lenir
      sqlServerConfig
    });

    res.status(201).json({
      success: true,
      connector: {
        id: connector._id,
        connectorName: connector.connectorName,
        clientId: connector.clientId,
        clientPassword: clientPassword, // Sadece bu seferlik düz metin olarak dön
        sqlServerConfig: connector.sqlServerConfig,
        aktif: connector.aktif
      }
    });
  } catch (error) {
    console.error('Create connector error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Connector güncelle
router.put('/:id', protect, async (req, res) => {
  try {
    const { connectorName, clientPassword, sqlServerConfig, aktif } = req.body;

    const connector = await Connector.findById(req.params.id);

    if (!connector) {
      return res.status(404).json({
        success: false,
        message: 'Connector bulunamadı'
      });
    }

    // Sadece kendi connector'ını güncelleyebilir
    if (connector.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    // Güncellenebilir alanlar
    if (connectorName) connector.connectorName = connectorName;
    if (clientPassword) connector.clientPassword = clientPassword; // Model'de otomatik hash'lenir
    if (sqlServerConfig) connector.sqlServerConfig = sqlServerConfig;
    if (typeof aktif !== 'undefined') connector.aktif = aktif;

    await connector.save();

    res.json({
      success: true,
      connector: {
        id: connector._id,
        connectorName: connector.connectorName,
        clientId: connector.clientId,
        sqlServerConfig: connector.sqlServerConfig,
        aktif: connector.aktif
      }
    });
  } catch (error) {
    console.error('Update connector error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Connector sil
router.delete('/:id', protect, async (req, res) => {
  try {
    const connector = await Connector.findById(req.params.id);

    if (!connector) {
      return res.status(404).json({
        success: false,
        message: 'Connector bulunamadı'
      });
    }

    // Sadece kendi connector'ını silebilir
    if (connector.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    await connector.deleteOne();

    res.json({
      success: true,
      message: 'Connector silindi'
    });
  } catch (error) {
    console.error('Delete connector error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;
