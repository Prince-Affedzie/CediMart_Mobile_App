// src/Apis/chatApi.js
import API from "./apiClient";


export const openConversation = (data) => API.post('/api/chat/conversations', data);

export const getInbox = (params) => API.get('/api/chat/conversations', { params });

export const getConversation = (id) => API.get(`/api/chat/conversations/${id}`);

export const archiveConversation = (id) => API.patch(`/api/chat/conversations/${id}/archive`);

export const getMessages = (id, params) => API.get(`/api/chat/conversations/${id}/messages`, { params });

export const sendMessage = (id, data) => API.post(`/api/chat/conversations/${id}/messages`, data);

export const markRead = (id) => API.patch(`/api/chat/conversations/${id}/read`);

export const getTotalUnread = () => API.get('/api/chat/unread');