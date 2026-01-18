const express = require('express');
const router = express.Router();
const axios = require('axios');
const { connectorAuth } = require('../middleware/connectorAuth');
const { protect } = require('../middleware/auth');
const CustomerSession = require('../models/CustomerSession');

const CONNECTOR_URL = process.env.CONNECTOR_URL || 'https://kernel.connectorabi.com/api/v1';

// Helper function to forward request to connector
const forwardToConnector = async (endpoint, connector, body) => {
  try {
    const response = await axios.post(`${CONNECTOR_URL}${endpoint}`, body, {
      headers: {
        'Content-Type': 'application/json',
        'clientId': connector.clientId,
        'clientPass': body.clientPass || ''
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Connector ${endpoint} error:`, error.message);
    throw error;
  }
};

// ============= GENERAL =============

// Get datetime from connector
router.post('/datetime', connectorAuth, async (req, res) => {
  try {
    const requestBody = {
      clientId: req.connector.clientId,
      clientPass: req.body.clientPass
    };

    const response = await axios.post(`${CONNECTOR_URL}/datetime`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'clientId': req.connector.clientId,
        'clientPass': req.body.clientPass
      },
      timeout: 10000
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Connector datetime servisi hatası',
      error: error.response?.data || error.message
    });
  }
});

// Run command on connector
router.post('/cmd', connectorAuth, async (req, res) => {
  try {
    const data = await forwardToConnector('/cmd', req.connector, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connector cmd servisi hatası',
      error: error.response?.data || error.message
    });
  }
});

// ============= SQL =============

// MS SQL Server
router.post('/mssql', connectorAuth, async (req, res) => {
  try {
    // SQL Server config'i request body'den veya connector'dan al
    const sqlConfig = req.body.config || {
      user: req.connector.sqlServerConfig.user,
      password: req.connector.sqlServerConfig.password,
      database: req.connector.sqlServerConfig.database,
      server: req.connector.sqlServerConfig.server,
      port: req.connector.sqlServerConfig.port
    };

    // ConnectorAbi için gerekli formatı hazırla
    const fullConfig = {
      ...sqlConfig,
      dialect: 'mssql',
      dialectOptions: {
        instanceName: ''
      },
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    };

    const requestBody = {
      clientId: req.connector.clientId,
      clientPass: req.body.clientPass,
      config: fullConfig,
      query: req.body.query
    };

    const response = await axios.post(`${CONNECTOR_URL}/mssql`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'clientId': req.connector.clientId,
        'clientPass': req.body.clientPass
      },
      timeout: 15000
    });

    // Veri yapısı: response.data.data.recordsets[0]
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Connector mssql servisi hatası',
      error: error.response?.data || error.message
    });
  }
});

// MySQL
router.post('/mysql', connectorAuth, async (req, res) => {
  try {
    const data = await forwardToConnector('/mysql', req.connector, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connector mysql servisi hatası',
      error: error.response?.data || error.message
    });
  }
});

// PostgreSQL
router.post('/pg', connectorAuth, async (req, res) => {
  try {
    const data = await forwardToConnector('/pg', req.connector, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connector pg servisi hatası',
      error: error.response?.data || error.message
    });
  }
});

// ============= FILE SYSTEM =============

// Read file
router.post('/read-file', connectorAuth, async (req, res) => {
  try {
    const data = await forwardToConnector('/read-file', req.connector, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connector read-file servisi hatası',
      error: error.response?.data || error.message
    });
  }
});

// Write file
router.post('/write-file', connectorAuth, async (req, res) => {
  try {
    const data = await forwardToConnector('/write-file', req.connector, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connector write-file servisi hatası',
      error: error.response?.data || error.message
    });
  }
});

// ============= EXCEL =============

// Read excel
router.post('/read-excel', connectorAuth, async (req, res) => {
  try {
    const data = await forwardToConnector('/read-excel', req.connector, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connector read-excel servisi hatası',
      error: error.response?.data || error.message
    });
  }
});

// Write excel
router.post('/write-excel', connectorAuth, async (req, res) => {
  try {
    const data = await forwardToConnector('/write-excel', req.connector, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connector write-excel servisi hatası',
      error: error.response?.data || error.message
    });
  }
});

// ============= REST API =============

// Rest API proxy
router.post('/rest', connectorAuth, async (req, res) => {
  try {
    const data = await forwardToConnector('/rest', req.connector, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connector rest servisi hatası',
      error: error.response?.data || error.message
    });
  }
});

// ============= CUSTOMER ENDPOINTS (JWT Protected) =============

// MS SQL Server - Customer authenticated endpoint
router.post('/customer/mssql', protect, async (req, res) => {
  try {
    // Get active connector from customer session
    const session = await CustomerSession.findOne({
      customerId: req.user.id,
      aktif: true
    }).populate('activeConnectorId');

    if (!session?.activeConnectorId) {
      return res.status(400).json({
        success: false,
        message: 'Aktif connector bulunamadı. Lütfen bir connector seçin.'
      });
    }

    const connector = session.activeConnectorId;

    // SQL Server config'i request body'den veya connector'dan al
    const sqlConfig = req.body.config || connector.sqlServerConfig;

    // ConnectorAbi için gerekli formatı hazırla
    const fullConfig = {
      user: sqlConfig.user,
      password: sqlConfig.password,
      database: sqlConfig.database,
      server: sqlConfig.server,
      port: sqlConfig.port,
      dialect: 'mssql',
      dialectOptions: {
        instanceName: sqlConfig.dialectOptions?.instanceName || ''
      },
      options: {
        encrypt: sqlConfig.options?.encrypt !== undefined ? sqlConfig.options.encrypt : false,
        trustServerCertificate: sqlConfig.options?.trustServerCertificate !== undefined ? sqlConfig.options.trustServerCertificate : true
      }
    };

    const requestBody = {
      clientId: connector.clientId,
      clientPass: connector.clientPassword,
      config: fullConfig,
      query: req.body.query
    };

    const response = await axios.post(`${CONNECTOR_URL}/mssql`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'clientId': connector.clientId,
        'clientPass': connector.clientPassword
      },
      timeout: 30000
    });

    // Veri yapısı: response.data.data.recordsets[0]
    res.json({
      success: true,
      data: response.data.data
    });
  } catch (error) {
    console.error('Customer mssql error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'SQL sorgusu çalıştırılamadı',
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;
