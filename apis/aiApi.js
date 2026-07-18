import API from "./apiClient";

export const aiSearch = (query,conversationId) =>
  API.post('/api/ai/i/search', {query,conversationId });
export const aiProductDetailsGenerator =(formData)=>
  API.post("/api/ai/i/anayze_image",formData,{
      headers: {
        'Content-Type': 'multipart/form-data',   // Let Axios set this automatically
      },
    })
