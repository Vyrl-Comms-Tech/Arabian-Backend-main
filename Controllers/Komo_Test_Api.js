const axios = require('axios');

// Kommo API Configuration
const KOMMO_CONFIG = {
  baseURL: 'https://kommo.cc/api/v1', // Base URL from documentation
  apiKey: 'reelly-6814829e-GLiJUWkxyVMNoMsQQ11WESTvt8QEI6Ye',
  headers: {
    'X-API-Key': 'reelly-6814829e-GLiJUWkxyVMNoMsQQ11WESTvt8QEI6Ye',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Create axios instance for Kommo API
const kommoAPI = axios.create({
  baseURL: KOMMO_CONFIG.baseURL,
  headers: KOMMO_CONFIG.headers,
//   timeout: 30000 // 30 seconds timeout
});

// Test Kommo API Connection
const testKommoConnection = async (req, res) => {
  try {
    console.log('Testing Kommo API connection...');
    
    // Try to fetch account info or any basic endpoint
    const response = await kommoAPI.get('/account');
    
    res.status(200).json({
      success: true,
      message: 'Kommo API connection successful',
      data: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Kommo API Connection Error:', error.message);
    
    let errorMessage = 'Failed to connect to Kommo API';
    let statusCode = 500;
    
    if (error.response) {
      // API responded with error status
      statusCode = error.response.status;
      errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response from Kommo API - check network connection';
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get Kommo Contacts
const getKommoContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    console.log(`Fetching Kommo contacts - Page: ${page}, Limit: ${limit}`);
    
    const response = await kommoAPI.get('/contacts', {
      params: {
        page,
        limit,
        with: 'leads,customers' // Include related data
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Kommo contacts fetched successfully',
      data: response.data,
      pagination: {
        currentPage: page,
        limit: limit,
        total: response.data?._embedded?.contacts?.length || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get Kommo Contacts Error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch Kommo contacts',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Create Kommo Contact
const createKommoContact = async (req, res) => {
  try {
    const {
      name:
      email,
      phone,
      company,
      position,
      tags,
      custom_fields
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required to create a contact'
      });
    }
    
    const contactData = {
      name,
      ...(email && { email }),
      ...(phone && { phone }),
      ...(company && { company }),
      ...(position && { position }),
      ...(tags && { tags }),
      ...(custom_fields && { custom_fields })
    };
    
    console.log('Creating Kommo contact:', contactData);
    
    const response = await kommoAPI.post('/contacts', contactData);
    
    res.status(201).json({
      success: true,
      message: 'Kommo contact created successfully',
      data: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create Kommo Contact Error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to create Kommo contact',
      error: error.message,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    });
  }
};

// Get Kommo Leads
const getKommoLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status; // Filter by status if provided
    
    console.log(`Fetching Kommo leads - Page: ${page}, Limit: ${limit}`);
    
    const params = {
      page,
      limit,
      with: 'contacts,pipeline'
    };
    
    if (status) {
      params.filter = { status_id: status };
    }
    
    const response = await kommoAPI.get('/leads', { params });
    
    res.status(200).json({
      success: true,
      message: 'Kommo leads fetched successfully',
      data: response.data,
      pagination: {
        currentPage: page,
        limit: limit,
        total: response.data?._embedded?.leads?.length || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get Kommo Leads Error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch Kommo leads',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Create Kommo Lead
const createKommoLead = async (req, res) => {
  try {
    const {
      name,
      price,
      pipeline_id,
      status_id,
      contact_id,
      company_id,
      tags,
      custom_fields
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Lead name is required'
      });
    }
    
    const leadData = {
      name,
      ...(price && { price }),
      ...(pipeline_id && { pipeline_id }),
      ...(status_id && { status_id }),
      ...(contact_id && { contact_id }),
      ...(company_id && { company_id }),
      ...(tags && { tags }),
      ...(custom_fields && { custom_fields })
    };
    
    console.log('Creating Kommo lead:', leadData);
    
    const response = await kommoAPI.post('/leads', leadData);
    
    res.status(201).json({
      success: true,
      message: 'Kommo lead created successfully',
      data: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create Kommo Lead Error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to create Kommo lead',
      error: error.message,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    });
  }
};

// Get Kommo Account Info
const getKommoAccount = async (req, res) => {
  try {
    console.log('Fetching Kommo account information...');
    
    const response = await kommoAPI.get('/account');
    
    res.status(200).json({
      success: true,
      message: 'Kommo account information fetched successfully',
      data: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get Kommo Account Error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch Kommo account information',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Generic Kommo API Proxy (for testing other endpoints)
const kommoProxy = async (req, res) => {
  try {
    const { endpoint } = req.params;
    const method = req.method.toLowerCase();
    
    console.log(`Kommo API Proxy - ${method.toUpperCase()} /${endpoint}`);
    
    let response;
    
    switch (method) {
      case 'get':
        response = await kommoAPI.get(`/${endpoint}`, {
          params: req.query
        });
        break;
      case 'post':
        response = await kommoAPI.post(`/${endpoint}`, req.body);
        break;
      case 'put':
        response = await kommoAPI.put(`/${endpoint}`, req.body);
        break;
      case 'patch':
        response = await kommoAPI.patch(`/${endpoint}`, req.body);
        break;
      case 'delete':
        response = await kommoAPI.delete(`/${endpoint}`);
        break;
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
    
    res.status(response.status).json({
      success: true,
      message: `Kommo API ${method.toUpperCase()} /${endpoint} successful`,
      data: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Kommo API Proxy Error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: `Kommo API ${req.method} /${req.params.endpoint} failed`,
      error: error.message,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    });
  }
};

// Property Lead Integration - Create lead from property inquiry
const createPropertyLead = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      propertyId,
      propertyTitle,
      propertyPrice,
      propertyType,
      inquiryType = 'Property Inquiry',
      message
    } = req.body;
    
    // Validate required fields
    if (!customerName || !propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and property ID are required'
      });
    }
    
    // First, create or find contact
    let contactId;
    try {
      const contactData = {
        name: customerName,
        ...(customerEmail && { email: customerEmail }),
        ...(customerPhone && { phone: customerPhone })
      };
      
      const contactResponse = await kommoAPI.post('/contacts', contactData);
      contactId = contactResponse.data?.id;
    } catch (contactError) {
      console.log('Contact creation failed, proceeding without contact ID');
    }
    
    // Create lead with property information
    const leadData = {
      name: `${inquiryType} - ${propertyTitle || `Property ${propertyId}`}`,
      price: propertyPrice || 0,
      ...(contactId && { contact_id: contactId }),
      custom_fields: [
        {
          field_code: 'PROPERTY_ID',
          values: [{ value: propertyId }]
        },
        {
          field_code: 'PROPERTY_TYPE',
          values: [{ value: propertyType || 'Unknown' }]
        },
        ...(message && [{
          field_code: 'INQUIRY_MESSAGE',
          values: [{ value: message }]
        }])
      ],
      tags: ['Property Inquiry', propertyType].filter(Boolean)
    };
    
    console.log('Creating property lead in Kommo:', leadData);
    
    const response = await kommoAPI.post('/leads', leadData);
    
    res.status(201).json({
      success: true,
      message: 'Property lead created successfully in Kommo',
      data: {
        lead: response.data,
        contactId: contactId,
        propertyId: propertyId
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create Property Lead Error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to create property lead in Kommo',
      error: error.message,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  testKommoConnection,
  getKommoContacts,
  createKommoContact,
  getKommoLeads,
  createKommoLead,
  getKommoAccount,
  kommoProxy,
  createPropertyLead
};