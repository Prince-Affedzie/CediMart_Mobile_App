///vendors/by_market

import API from "./apiClient";

export const getVendorsByMarket = ()=>API.get('/api/vendors/by_market')
export const getVendors =(params = {}) => API.get('/api/vendor', { params });
export const getVendorById =(id)=>API.get(`/api/vendor/${id}`)
///api/vendor_profile
export const getMyProducts = ()=>API.get("/api/vendor/my_products")
export const getMyProfileDetails =()=>API.get('/api/vendor_profile')

export const updateProfile = async (data) => {
  try {
    // CRITICAL: For FormData with images, do NOT set Content-Type manually
    const response = await API.put('/api/vendor_update_profile', data, {
      headers: {
        'Content-Type': 'multipart/form-data',   // Let Axios set this automatically
      },
    });

    console.log('✅ Profile updated successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Profile Update Failed:', {
      message: error.message,
      status: error?.response?.status,
      data: error?.response?.data,
      url: error?.config?.url,
    });
    throw error;
  }
};

export const createProduct = async (data) => {
  try {
    // CRITICAL: For FormData with images, do NOT set Content-Type manually
    const response = await API.post('/api/product-add', data, {
      headers: {
        'Content-Type': 'multipart/form-data',   // Let Axios set this automatically
      },
    });

    console.log('✅ Product created successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Create Product Failed:', {
      message: error.message,
      status: error?.response?.status,
      data: error?.response?.data,
      url: error?.config?.url,
    });
    throw error;
  }
};

export const getProductById = async (identifier) => {
  try {
    const response = await API.get(`/api/product/${identifier}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateProduct = async (id, formData) => {
  try {
    const response = await API.put(`/api/product-update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.log(error)
    throw error.response?.data || error;
  }
};


export const getMyOrders =async() => {
  try {
    const response = await API.get('/api/vendor_my_orders');
    return response;
  } catch (error) {
    console.log(error)
    throw error;
  }
};


export const deleteProduct = async (id) => {
  try {
    const response = await API.delete(`/api/product-delete/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};
