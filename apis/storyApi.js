// src/apis/storyApi.js
import API from './apiClient';


// Get active stories from followed vendors
export const getActiveStories = (params = {}) => 
  API.get('/api/stories/active', { params });

// Get vendor stories (only if following)
export const getVendorStories = (vendorId, params = {}) => 
  API.get(`/api/stories/vendor/${vendorId}`, { params });

// Create story (image via FormData, video via Bunny Stream)
export const createStory = (formData) => 
  API.post('/api/stories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });

// Record story view
export const viewStory = (storyId) => 
  API.post(`/api/stories/${storyId}/view`);

// React to story
export const reactToStory = (storyId, emoji) => 
  API.post(`/api/stories/${storyId}/react`, { emoji });

// Delete story
export const deleteStory = (storyId) => 
  API.delete(`/api/stories/${storyId}`);

export const getMyStories = (params = {}) => 
  API.get('/api/stories/mine', { params });

export const getStoryStats = (storyId) => 
  API.get(`/api/stories/${storyId}/stats`);