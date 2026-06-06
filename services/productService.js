
import API from '../apis/apiClient'; 

class ProductService {
 // Update the getProducts method to handle category mapping better
async getProducts(filters = {}) {
  try {
    // ── 1. Category ──────────────────────────────────────────────────────────
    // Pass through as-is; backend validates against its enum.
    // Only strip 'all' — that means "no category filter".
    const category =
      filters.category && filters.category !== 'all'
        ? filters.category
        : undefined;
 
    // ── 2. Subcategory ───────────────────────────────────────────────────────
    // Only meaningful when a parent category is also set.
    const subcategory =
      category && filters.subcategory
        ? filters.subcategory
        : undefined;
 
    // ── 3. Sort ──────────────────────────────────────────────────────────────
    // Accept the backend key directly (from the new ProductsScreen), but also
    // keep backward-compat with legacy `sortBy` values from older screens.
    const SORT_MAP = {
      // legacy UI keys → backend keys
      'name':        'newest',   // was alphabetical sort; fall back gracefully
      'name-desc':   'newest',
      'price':       'price-asc',
      'price-desc':  'price-desc',
      'newest':      'newest',
      'oldest':      'oldest',
      'price-asc':   'price-asc',
      'popular':     'popular',
      'rating':      'rating',
    };
 
    // Prefer explicit `sort`, fall back to mapped `sortBy`, default to 'newest'
    const rawSort = filters.sort || filters.sortBy || 'newest';
    const sort = SORT_MAP[rawSort] ?? 'newest';
 
    // ── 4. Negotiable ────────────────────────────────────────────────────────
    // Accept boolean true/false or string 'true'/'false'; omit when falsy so
    // the backend doesn't filter unnecessarily.
    let negotiable;
    if (filters.negotiable === true || filters.negotiable === 'true') {
      negotiable = 'true';
    } else if (filters.negotiable === false || filters.negotiable === 'false') {
      // Only send explicit false if the caller really wants non-negotiable items
      negotiable = undefined;
    }
 
    // ── 5. Price range ───────────────────────────────────────────────────────
    const minPrice = filters.minPrice !== '' && filters.minPrice != null
      ? Number(filters.minPrice)
      : undefined;
 
    const maxPrice = filters.maxPrice !== '' && filters.maxPrice != null
      ? Number(filters.maxPrice)
      : undefined;
 
    // Guard: if either price is NaN after coercion, discard it
    const safeMinPrice = !isNaN(minPrice) ? minPrice : undefined;
    const safeMaxPrice = !isNaN(maxPrice) ? maxPrice : undefined;
 
    // ── 6. Pagination ────────────────────────────────────────────────────────
    const page  = Math.max(parseInt(filters.page)  || 1, 1);
    const limit = Math.min(parseInt(filters.limit) || 20, 50);
 
    // ── 7. Assemble params ───────────────────────────────────────────────────
    const params = {
      category,
      subcategory,
      campus:     filters.campus     || undefined,
      condition:  filters.condition  || undefined,
      negotiable,
      search:     filters.search?.trim() || undefined,
      minPrice:   safeMinPrice,
      maxPrice:   safeMaxPrice,
      sort,
      page,
      limit,
    };
 
    // Strip undefined / empty-string keys so Axios doesn't send empty query params
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });
 
    // ── 8. Request ───────────────────────────────────────────────────────────
    const response = await API.get('/api/products', { params });
 
    return {
      success:    response.data.success || response.success,
      data:       response.data.data       || response.data || [],
      total:      response.data.total      || 0,
      pagination: response.data.pagination || {},
      error:      response.data.message,
    };
 
  } catch (error) {
    console.error('getProducts error:', error);
    return {
      success: false,
      error:   error.response?.data?.message || error.message || 'Failed to fetch products',
      data:    [],
      total:   0,
    };
  }
}
///products/tag/:tag

 async getProductByTag(tag) {
    
      try {
        const response = await API.get(`/api/products/tag/${tag}`);
        
        return response;
      } catch (error) {
        console.error('Error fetching product:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch product',
          data: null,
        };
      }
    }


    async getProductById(id) {
    
      try {
        const response = await API.get(`/api/product/${id}`);
        
        return response;
      } catch (error) {
        console.error('Error fetching product:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch product',
          data: null,
        };
      }
    }

  async getProductsByCategory(category, sort = 'name', limit = 50) {
    try {
      const response = await API.get(`/api/products/category/${category}`, {
        params: { sort, limit }
      });
      
      return {
        success: response.data.success,
        data: response.data.data || [],
        category: response.data.category || {},
        stats: response.data.stats || {},
        error: response.data.message,
      };
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  async searchProducts(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          error: 'Search query must be at least 2 characters',
          data: [],
        };
      }

      const response = await API.get(`/api/products/search/${query}`, {
        params: { limit }
      });

      return {
        success: response.data.success,
        data: response.data.suggestions || response.data.data || [],
        query: response.data.query || query,
        error: response.data.message,
      };
    } catch (error) {
      console.error('Error searching products:', error);
      return {
        success: false,
        error: error.message || 'Failed to search products',
        data: [],
      };
    }
  }

  async getCategories() {
    // Based on your backend, you need to create this endpoint or use static
    // For now, using categories that match backend's category logic
   const categories = [
  // Produce
  { id: 'vegetables', name: 'Vegetables', icon: '🥦' },
  { id: 'fruits', name: 'Fruits', icon: '🍎' },
  { id: 'herb', name: 'Herbs', icon: '🌿' },
  { id: 'tuber', name: 'Tubers', icon: '🥔' },
  
  // Grains & Staples
  { id: 'staples', name: 'Staples', icon: '🌾' },
  { id: 'grain', name: 'Grains', icon: '🌾' },
  { id: 'cereal', name: 'Cereals', icon: '🥣' },
  
  // Protein
  { id: 'meat', name: 'Meat', icon: '🥩' },
  { id: 'poultry', name: 'Poultry', icon: '🍗' },
  { id: 'seafood', name: 'Seafood', icon: '🐟' },
  
  // Pantry
  { id: 'spice', name: 'Spices', icon: '🌶️' },
  
  // Special
  { id: 'frozen-food', name: 'Frozen Foods', icon: '🧊' },
  
  // Other
  { id: 'other', name: 'Others', icon: '📦' },
];

    return {
      success: true,
      data: categories,
    };
  }

  // Helper to map frontend sort to backend sort
  mapSortToBackend(sortBy) {
    const sortMap = {
      'name': 'name', // Default is name-asc
      'name-asc': 'name',
      'name-desc': 'name-desc',
      'price': 'price-asc',
      'price-asc': 'price-asc',
      'price-desc': 'price-desc',
      'newest': 'newest',
      'stock': 'stock-desc',
      'createdAt': 'newest',
    };
    
    return sortMap[sortBy] || 'name';
  }

  // Helper to map backend category to frontend display
  getCategoryDisplay(category) {
    const displayMap = {
      'vegetable': 'Vegetable',
      'fruit': 'Fruit',
      'staple': 'Staple',
      'herb': 'Herb',
      'tuber': 'Tuber',
      'other': 'Other',
      'vegetables': 'Vegetables', // Combined category
      'fruits': 'Fruits',
      'staples': 'Staples',
    };
    
    return displayMap[category] || category;
  }

  // Batch get products by IDs
  async getProductsByIds(ids) {
    try {
      const promises = ids.map(id => this.getProductById(id));
      const results = await Promise.all(promises);
      
      const products = results
        .filter(result => result.success)
        .map(result => result.data);
      
      return {
        success: true,
        data: products,
      };
    } catch (error) {
      console.error('Error fetching products by IDs:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }
}

export default new ProductService();