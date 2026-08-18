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

export const incrementView = (postId) => 
  API.post(`/api/feed/${postId}/view`);

// ─── Comments ──────────────────────────────────────────────────────────────
// Get comments for a post (top-level with limited replies)
export const getComments = (postId, params = {}) => 
  API.get(`/api/feed/${postId}/comments`, { params });

// Add a comment or reply (handles both top-level and replies)
export const addComment = (postId, text, parentCommentId = null) => 
  API.post(`/api/feed/${postId}/comments`, { 
    postId, 
    text, 
    parentCommentId 
  });

// Get replies for a specific comment
export const getReplies = (commentId, params = {}) => 
  API.get(`/api/comments/${commentId}/replies`, { params });

// Like/Unlike a comment
export const toggleCommentLike = (commentId) => 
  API.post(`/api/comments/${commentId}/like`);

// Update a comment (only author)
export const updateComment = (commentId, text) => 
  API.put(`/api/comments/${commentId}`, { text });

// Delete a comment (author or moderator)
export const deleteComment = (commentId) => 
  API.delete(`/api/comments/${commentId}`);

// Report a comment
export const reportComment = (commentId, reason, description = null) => 
  API.post(`/api/comments/${commentId}/report`, { reason, description });

// ─── Delete ────────────────────────────────────────────────────────────────
export const deleteFeedPost = (postId) => 
  API.delete(`/api/feed/${postId}`);