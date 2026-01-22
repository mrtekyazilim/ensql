const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const Customer = require('../models/Customer');
const Partner = require('../models/Partner');
const Connector = require('../models/Connector');

// JWT token doğrulama middleware
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Yetkisiz erişim - Token bulunamadı'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Token'dan role bilgisini al ve uygun modeli kullan
    let user;
    if (decoded.role === 'admin' || decoded.role === 'user') {
      user = await AdminUser.findById(decoded.id).select('-password');
    } else if (decoded.role === 'partner') {
      user = await Partner.findById(decoded.id).select('-password');
      if (user) {
        user.role = 'partner';
      }
    } else {
      user = await Customer.findById(decoded.id).select('-password');
      // Customer için role ekle (model'de yok)
      if (user) {
        user.role = 'customer';
      }
    }

    req.user = user;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Hizmet bitiş tarihi kontrolü (customer ve partner için)
    if (req.user.hizmetBitisTarihi) {
      if (new Date() > new Date(req.user.hizmetBitisTarihi)) {
        return res.status(403).json({
          success: false,
          message: 'Hizmet süreniz dolmuştur'
        });
      }
    }

    // Partner aktif kontrolü
    if (req.user.role === 'partner' && req.user.aktif === false) {
      return res.status(403).json({
        success: false,
        message: 'Partner hesabınız pasif durumda'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Yetkisiz erişim - Geçersiz token'
    });
  }
};

// Admin yetkisi kontrolü
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için admin yetkisi gereklidir'
    });
  }
};

// Partner yetkisi kontrolü
exports.partnerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'partner') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için partner yetkisi gereklidir'
    });
  }
};

// Connector authentication
exports.connectorAuth = async (req, res, next) => {
  const { clientId, clientPassword } = req.body;

  if (!clientId || !clientPassword) {
    return res.status(401).json({
      success: false,
      message: 'ClientId ve clientPassword gereklidir'
    });
  }

  try {
    const connector = await Connector.findOne({ clientId }).populate('customerId');

    if (!connector) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz connector bilgileri'
      });
    }

    // Düz metin karşılaştırma
    if (connector.clientPassword !== clientPassword) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz connector bilgileri'
      });
    }

    const user = connector.customerId;

    // Hizmet bitiş tarihi kontrolü
    if (user.hizmetBitisTarihi && new Date() > new Date(user.hizmetBitisTarihi)) {
      return res.status(403).json({
        success: false,
        message: 'Hizmet süreniz dolmuştur'
      });
    }

    req.connectorUser = user;
    req.connector = connector;
    next();
  } catch (error) {
    console.error('Connector auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
};
