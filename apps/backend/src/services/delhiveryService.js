/**
 * Delhivery B2C API Service
 * Handles AWB generation, shipment creation, and tracking.
 */

const DELHIVERY_BASE = process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com';
const DELHIVERY_STAGING = 'https://staging-express.delhivery.com';

const getBaseUrl = () => {
  return process.env.NODE_ENV === 'production' ? DELHIVERY_BASE : DELHIVERY_STAGING;
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Token ${process.env.DELHIVERY_API_TOKEN}`,
});

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
    paymentMode, // 'Prepaid' or 'COD'
    weight, // in grams
  } = orderData;

  const payload = {
    format: 'json',
    data: {
      shipments: [
        {
          name: consigneeName,
          add: consigneeAddress,
          pin: consigneePincode,
          city: consigneeCity,
          state: consigneeState,
          country: 'India',
          phone: consigneePhone,
          order: orderId,
          payment_mode: paymentMode === 'COD' ? 'COD' : 'Pre-paid',
          return_pin: '',
          return_city: '',
          return_phone: '',
          return_add: '',
          return_state: '',
          return_country: '',
          products_desc: itemDescription,
          hsn_code: '',
          cod_amount: paymentMode === 'COD' ? totalAmount : 0,
          order_date: new Date().toISOString(),
          total_amount: totalAmount,
          seller_add: '',
          seller_name: 'Aurenza',
          seller_inv: '',
          quantity: 1,
          waybill: '', // Empty = auto-generate AWB
          shipment_width: 10,
          shipment_height: 10,
          weight: weight || 500,
          seller_gst_tin: '',
          shipping_mode: 'Surface',
          address_type: 'home',
        },
      ],
      pickup_location: {
        name: process.env.DELHIVERY_WAREHOUSE_NAME || 'Aurenza Warehouse',
      },
    },
  };

  try {
    const response = await fetch(`${getBaseUrl()}/api/cmu/create.json`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.rmk || 'Shipment creation failed');
    }

    // Extract AWB from response
    const shipmentResult = data.packages?.[0] || data;
    return {
      awb: shipmentResult.waybill || shipmentResult.awb || null,
      status: shipmentResult.status || 'created',
      refnum: shipmentResult.refnum || orderId,
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
    pickup_time: pickupData.pickupTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    pickup_date: pickupData.pickupDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pickup_location: process.env.DELHIVERY_WAREHOUSE_NAME || 'Aurenza Warehouse',
    expected_package_count: pickupData.packageCount || 1,
  };

  try {
    const response = await fetch(`${getBaseUrl()}/fm/request/new/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
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
    const response = await fetch(
      `${getBaseUrl()}/api/v1/packages/json/?waybill=${awb}&token=${process.env.DELHIVERY_API_TOKEN}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const data = await response.json();
    const shipment = data.ShipmentData?.[0]?.Shipment;

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    return {
      awb: shipment.AWB,
      status: shipment.Status?.Status || 'Unknown',
      location: shipment.Status?.StatusLocation || '',
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
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const data = await response.json();
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
