import API from "./apiClient";
export const getAllProducts = (params) => API.get('/api/products', { params });
export const getProductById =(id)=>API.get(`/api/product/${id}`)
export const getProductsByCategory =(category,params)=>API.get(`/api/products/category/${category}`,{params:params})
export const searchProducts =(query)=>API.get(`/api/products/search/${query}`)
export const getProductsByCampus =(campus,params)=>API.get(`/api/products/campus/${campus}`,{params:params})
export const getProductsByTag = (tag)=>API.get(`/api/products/tag/${tag}`)
