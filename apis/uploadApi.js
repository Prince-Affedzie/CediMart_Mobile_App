// src/apis/uploadApi.js
import API from './apiClient';

export const uploadApi = {
  // Step 1: Get signed URL
  getSignedUrl: (fileName, contentType, folder = 'feed') =>
    API.post('/api/upload/signed-url', { fileName, contentType, folder }),

  // Step 2: Upload directly to Supabase (with progress)
  uploadToSupabase: async (signedUrl, file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(event.loaded / event.total);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));

      xhr.open('PUT', signedUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    });
  },

  // Step 3: Confirm upload
  confirmUpload: (path, postId, index) =>
    API.post('/api/upload/confirm', { path, postId, index }),

    // Initialize a Bunny video upload
  initVideoUpload: (title) =>
    API.post('/api/upload/init-video', { title }),

  // Upload video to Bunny via TUS (with progress)
  uploadToBunny: async (tusEndpoint, file, signature, expirationTime, videoId, libraryId, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(event.loaded / event.total);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.getResponseHeader('Location') || videoId);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));

      xhr.open('POST', tusEndpoint, true);
      xhr.setRequestHeader('AuthorizationSignature', signature);
      xhr.setRequestHeader('AuthorizationExpire', String(expirationTime));
      xhr.setRequestHeader('VideoId', videoId);
      xhr.setRequestHeader('LibraryId', String(libraryId));
      xhr.send(file);
    });
  },

};