
import API from "./apiClient";

export const generateReferralLink = async (productId) => {
  const response = await API.post('/api/referrals/generate', { productId });
  return response.data;
};

export const trackReferralClick = async (code) => {
  const response = await API.get(`/api/referrals/track/${code}`);
  return response.data;
};

export const getMyReferralStats = async () => {
  const response = await API.get('/api/referrals/my-stats');
  return response.data;
};

export const withdrawToMomo = async (data) => {
  const response = await API.post('/api/wallet/withdraw', data);
  return response.data;
};

export const convertToShoppingCredit = async (amount) => {
  const response = await API.post('/api/wallet/use-as-credit', { amount });
  return response.data;
};

export const getVendorReferralStats = async () => {
  const response = await API.get('/api/v/referral-stats');
  return response.data;
};

export const updateProductCommission = async (productId, commissionPct) => {
  const response = await API.patch(`/api/products/${productId}/commission`, { commissionPct });
  return response.data;
};