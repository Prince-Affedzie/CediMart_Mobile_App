import API from "./apiClient";

export const SignUp = (data)=>API.post('/api/register/account',data)
export const login =(data)=>API.post('/api/login',data)
export const vendorLogin =(data)=>API.post('/api/vendor/login',data)
export const signUpByGoogle = (data)=>API.post('/api/google_sign_up',data)
export const loginByGoogle =(data)=>API.post('/api/google_login',data)
export const logout =()=>API.post('/api/logout')
export const updateProfile = (data)=>API.put('/api/update-account',data)
export const deleteProfile = ()=>API.delete('/api/delete-account')
export const signUpByApple = (data)=>API.post('/api/apple_sign_up',data)
export const sendPushToken = (data)=>API.post('/api/user/push-token',data)
export const apple_signUp = (data)=>API.post('/api/apple/authenticate',data)
