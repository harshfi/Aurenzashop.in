/**
 * Delhivery B2C API Service
 * Handles AWB generation, shipment creation, and tracking.
 */

const { PAYMENT_METHODS } = require('@aurenza/shared');

const DELHIVERY_BASE = 'https://track.delhivery.com';
const DELHIVERY_STAGING = 'https://staging-express.delhivery.com';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const getConfiguredBaseUrl = () => {
  const configuredBaseUrl = process.env.DELHIVERY_BASE_URL;
  if (configuredBaseUrl) {
    return trimTrailingSlash(configuredBaseUrl);
  }

  const configuredEnvironment = (
    process.env.DELHIVERY_ENV ||
    process.env.NODE_ENV ||
    'development'
  ).toLowerCase();

  return configuredEnvironment === 'production' || configuredEnvironment === 'live'
    ? DELHIVERY_BASE
    : DELHIVERY_STAGING;
};

const getBaseUrl = () => {
  return getConfiguredBaseUrl();
};

const getHeaders = (contentType = 'application/json') => ({
  Accept: 'application/json',
  ...(contentType ? { 'Content-Type': contentType } : {}),
  'Authorization': `Token ${process.env.DELHIVERY_API_TOKEN}`,
});

const getWarehouseName = () => process.env.DELHIVERY_WAREHOUSE_NAME || 'Aurenza Warehouse';

const parseResponseBody = async (response) => {
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return { raw: rawBody };
  }
};

const extractErrorMessage = (payload) => {
  if (!payload) return null;

  return (
    payload.rmk ||
    payload.error ||
    payload.message ||
    payload.detail ||
    payload.raw ||
    null
  );
};

const normalizePaymentMode = (paymentMode) => {
  if (!paymentMode) return 'Pre-paid';

  const normalized = String(paymentMode).trim().toLowerCase();

  if (
    normalized === PAYMENT_METHODS.COD ||
    normalized === 'cod' ||
    normalized === 'cash on delivery'
  ) {
    return 'COD';
  }

  return 'Pre-paid';
};

const formatPickupDate = (value) => {
  const date = value ? new Date(value) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
};

const formatPickupTime = (value) => {
  if (value && /^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const date = value ? new Date(value) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[1].slice(0, 8);
};

/**
 * Create a shipment and generate AWB
 * @param {Object} orderData - Order details for shipment
 * @returns {Object} { awb, status }
 */
const createShipment = async (orderData) => {
  const {
    orderId,
    consigneeName,
    consigneePhone,
    consigneeAddress,
    consigneeCity,
    consigneeState,
    consigneePincode,
    itemDescription,
    totalAmount,
    paymentMode,
    weight, // in grams
  } = orderData;

  const normalizedPaymentMode = normalizePaymentMode(paymentMode);

  const shipment = {
    name: consigneeName,
    add: consigneeAddress,
    pin: consigneePincode,
    city: consigneeCity,
    state: consigneeState,
    country: 'India',
    phone: consigneePhone,
    order: orderId,
    payment_mode: normalizedPaymentMode,
    products_desc: itemDescription,
    cod_amount: normalizedPaymentMode === 'COD' ? totalAmount : 0,
    order_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    total_amount: totalAmount,
    seller_name: 'Aurenza',
    quantity: 1,
    waybill: '',
    shipment_width: 10,
    shipment_height: 10,
    weight: weight || 500,
    shipping_mode: 'Surface',
    address_type: 'home',
  };

  if (process.env.DELHIVERY_CLIENT_NAME) {
    shipment.client = process.env.DELHIVERY_CLIENT_NAME;
  }

  if (process.env.DELHIVERY_DEFAULT_HSN_CODE) {
    shipment.hsn_code = process.env.DELHIVERY_DEFAULT_HSN_CODE;
  }

  if (process.env.DELHIVERY_SELLER_GST_TIN) {
    shipment.seller_gst_tin = process.env.DELHIVERY_SELLER_GST_TIN;
  }

  const payload = new URLSearchParams({
    format: 'json',
    data: JSON.stringify({
      shipments: [shipment],
      pickup_location: {
        name: getWarehouseName(),
      },
    }),
  });

  try {
    const response = await fetch(`${getBaseUrl()}/api/cmu/create.json`, {
      method: 'POST',
      headers: getHeaders('application/x-www-form-urlencoded'),
      body: payload.toString(),
    });

    const data = await parseResponseBody(response);
    const errorMessage = extractErrorMessage(data);

    if (!response.ok || errorMessage || data?.success === false) {
      // Delhivery staging often has missing configuration for test accounts
      if (
        getBaseUrl() === DELHIVERY_STAGING &&
        errorMessage &&
        errorMessage.includes('end_date')
      ) {
        console.warn('Delhivery staging API is misconfigured. Using mock AWB.');
        return {
          awb: `TEST${Date.now().toString().slice(-8)}`,
          status: 'created',
          refnum: orderId,
        };
      }

      throw new Error(errorMessage || response.statusText || 'Shipment creation failed');
    }

    // Extract AWB from response
    const shipmentResult = data?.packages?.[0] || data;
    const awb = shipmentResult?.waybill || shipmentResult?.awb || null;

    if (!awb) {
      throw new Error('Delhivery did not return an AWB.');
    }

    return {
      awb,
      status: shipmentResult?.status || 'created',
      refnum: shipmentResult?.refnum || orderId,
    };
  } catch (error) {
    console.error('Delhivery shipment creation error:', error);
    throw new Error(`Delhivery shipment failed: ${error.message}`);
  }
};

/**
 * Request pickup for created shipments
 * @param {Object} pickupData
 * @returns {Object} Pickup confirmation
 */
const requestPickup = async (pickupData) => {
  const payload = {
    pickup_time: formatPickupTime(pickupData.pickupTime),
    pickup_date: formatPickupDate(pickupData.pickupDate),
    pickup_location: getWarehouseName(),
    expected_package_count: pickupData.packageCount || 1,
  };

  try {
    const response = await fetch(`${getBaseUrl()}/fm/request/new/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw new Error(extractErrorMessage(data) || response.statusText || 'Pickup request failed');
    }

    return data;
  } catch (error) {
    console.error('Delhivery pickup request error:', error);
    throw new Error(`Pickup request failed: ${error.message}`);
  }
};

/**
 * Track a shipment by AWB number
 * @param {string} awb - Airway Bill number
 * @returns {Object} Tracking details
 */
const trackShipment = async (awb) => {
  try {
    // Return mock data for test AWBs
    if (process.env.NODE_ENV !== 'production' && awb.startsWith('TEST')) {
      // Use deterministic timestamps so repeated fetches don't create duplicate tracking events
      const mockTimestamp = parseInt(awb.replace('TEST', '')) || Date.now();
      return {
        awb: awb,
        status: 'In Transit',
        location: 'Delhivery Hub, Bengaluru',
        scans: [
          {
            status: 'Manifested',
            location: 'Aurenza Warehouse',
            timestamp: new Date(mockTimestamp).toISOString(),
            instructions: 'Package ready for dispatch',
          },
          {
            status: 'In Transit',
            location: 'Delhivery Hub, Bengaluru',
            timestamp: new Date(mockTimestamp + 24 * 60 * 60 * 1000).toISOString(),
            instructions: 'In transit to destination',
          },
        ],
      };
    }

    const response = await fetch(
      `${getBaseUrl()}/api/v1/packages/json/?waybill=${awb}&token=${process.env.DELHIVERY_API_TOKEN}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );

    const data = await parseResponseBody(response);
    const shipmentNode = data?.ShipmentData?.[0]?.Shipment || data?.ShipmentData?.[0];
    const shipment = Array.isArray(shipmentNode) ? shipmentNode[0] : shipmentNode;

    if (!response.ok) {
      throw new Error(extractErrorMessage(data) || response.statusText || 'Shipment not found');
    }

    if (!shipment) {
      throw new Error(extractErrorMessage(data) || 'Shipment not found');
    }

    return {
      awb: shipment.AWB || awb,
      status: shipment.Status?.Status || shipment.CurrentStatus || 'Unknown',
      location: shipment.Status?.StatusLocation || shipment.CurrentLocation || '',
      scans: (shipment.Scans || []).map((scan) => ({
        status: scan.ScanDetail?.Scan || '',
        location: scan.ScanDetail?.ScannedLocation || '',
        timestamp: scan.ScanDetail?.ScanDateTime || '',
        instructions: scan.ScanDetail?.Instructions || '',
      })),
    };
  } catch (error) {
    console.error('Delhivery tracking error:', error);
    throw new Error(`Tracking failed: ${error.message}`);
  }
};

/**
 * Check pincode serviceability
 * @param {string} pincode
 * @returns {Object} Serviceability info
 */
const checkServiceability = async (pincode) => {
  try {
    const response = await fetch(
      `${getBaseUrl()}/c/api/pin-codes/json/?filter_codes=${pincode}&token=${process.env.DELHIVERY_API_TOKEN}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );

    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw new Error(extractErrorMessage(data) || response.statusText || 'Serviceability lookup failed');
    }

    const deliveryInfo = data.delivery_codes?.[0]?.postal_code;

    return {
      serviceable: !!deliveryInfo,
      city: deliveryInfo?.city || null,
      state: deliveryInfo?.state_code || null,
      cod: deliveryInfo?.cod === 'Y',
      prepaid: deliveryInfo?.pre_paid === 'Y',
    };
  } catch (error) {
    console.error('Delhivery serviceability check error:', error);
    return { serviceable: false };
  }
};

module.exports = {
  createShipment,
  requestPickup,
  trackShipment,
  checkServiceability,
};
