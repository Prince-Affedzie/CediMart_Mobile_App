import API from "./apiClient";
export const getAllProducts = (params) => API.get('/api/products', { params });
export const getProductById =(id)=>API.get(`/api/product/${id}`)
export const getProductsByCategory =(category)=>API.get(`/api/products/category/${category}`)
export const searchProducts =(query)=>API.get(`/api/products/search/${query}`)
export const deleteProduct = async (id) => {
  try {
    const response = await API.delete(`/api/product-delete/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};
