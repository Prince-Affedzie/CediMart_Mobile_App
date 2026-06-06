import API from "./apiClient";

export const getOTP = (phoneNumber) =>
  API.post('/api/send-otp', { phoneNumber });

export const sendOTPVendor = (phoneNumber)=>
  API.post('/api/vendor-send-otp',{ phoneNumber })

export const verifyOTP = (phoneNumber, otp) =>
  API.post('/api/verify-otp', { phoneNumber, otp });


export const resetPassword = (phoneNumber, newPassword) =>
  API.post('/api/reset-password', { phoneNumber, newPassword });