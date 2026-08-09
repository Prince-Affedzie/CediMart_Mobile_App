// src/apis/feedApi.js
import API from './apiClient';

// ─── Feed ──────────────────────────────────────────────────────────────────
export const getFeed = (params = {}) => 
  API.get('/api/feed', { params });

export const getMyFeedPosts = (params = {}) => 
  API.get('/api/me/feed/my-posts', { params });

export const getTrendingPosts = () => 
  API.get('/api/feed/trending');

export const getSavedPosts = (params = {}) => 
  API.get('/api/feed/saved', { params });

export const getPostDetail = (postId) => 
  API.get(`/api/feed/${postId}`);

// ─── Create Post ───────────────────────────────────────────────────────────
export const createFeedPost = (formData) => {
  return API.post('/api/create_feed', formData, {
    timeout: 120000,  
  });
};



export const updateFeedPost = (postId, formData) => 
  API.put(`/api/feed/${postId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });

// ─── Interactions ──────────────────────────────────────────────────────────
export const toggleLike = (postId) => 
  API.post(`/api/feed/${postId}/like`);

export const toggleSave = (postId) => 
  API.post(`/api/feed/${postId}/save`);

export const addComment = (postId, text) => 
  API.post(`/api/feed/${postId}/comment`, { text });

export const incrementView = (postId) => 
  API.post(`/api/feed/${postId}/view`);

// ─── Delete ────────────────────────────────────────────────────────────────
export const deleteFeedPost = (postId) => 
  API.delete(`/api/feed/${postId}`);