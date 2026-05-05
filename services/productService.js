
import API from '../apis/apiClient'; 

class ProductService {
 // Update the getProducts method to handle category mapping better
async getProducts(filters = {}) {
  try {
    // Map frontend category names to backend category values
    let categoryParam = filters.category;
    
    if (categoryParam && categoryParam !== 'all') {
      // Map frontend plural categories to backend singular
      const categoryMap = {
        'vegetables': 'vegetable',
        'fruits': 'fruit',
        'staples': 'staple',
        'herb': 'herb',
        'tuber': 'tuber',
        'other': 'other',
        'vegetable': 'vegetable',
        'fruit': 'fruit',
        'staple': 'staple',
      };
      
      categoryParam = categoryMap[categoryParam] || categoryParam;
    }

    const params = {
      category: categoryParam !== 'all' ? categoryParam : undefined,
      search: filters.search || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      market: filters.market || undefined,
      isAvailable: filters.inStockOnly ? 'true' : undefined,
      sort: this.mapSortToBackend(filters.sortBy),
      page: filters.page || 1,
      limit: filters.limit || 20
    };

    // Remove undefined params
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    const response = await API.get('/api/products', { params });

    return {
      success: response.data.success,
      data: response.data.data || [],
      total: response.data.total || 0,
      pagination: response.data.pagination || {},
      filters: response.data.filters || {},
      error: response.data.message,
    };

  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch products',
      data: [],
      total: 0,
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