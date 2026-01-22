const Connector = require('../models/Connector');

// Connector Authentication Middleware
const connectorAuth = async (req, res, next) => {
  try {
    const clientId = req.headers['clientid'] || req.body.clientId;
    const clientPass = req.headers['clientpass'] || req.body.clientPass;

    if (!clientId || !clientPass) {
      return res.status(401).json({
        success: false,
        message: 'clientId ve clientPass gereklidir'
      });
    }

    // Connector'ı bul
    const connector = await Connector.findOne({ clientId, aktif: true });

    if (!connector) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz connector bilgileri'
      });
    }

    // Password kontrolü (plain text karşılaştırma)
    const isPasswordValid = connector.compareClientPassword(clientPass);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz connector bilgileri'
      });
    }

    // Connector bilgisini request'e ekle
    req.connector = connector;
    next();
  } catch (error) {
    console.error('Connector auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Kimlik doğrulama hatası'
    });
  }
};

module.exports = { connectorAuth };
