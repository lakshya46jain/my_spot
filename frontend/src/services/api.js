// API service for communicating with the backend
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-backend-url.vercel.app' // Replace with your actual backend URL
  : 'http://localhost:5001';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Spots API methods
  async getSpots() {
    return this.request('/api/spots');
  }

  async getSpot(id) {
    return this.request(`/api/spots/${id}`);
  }

  async createSpot(spotData) {
    return this.request('/api/spots', {
      method: 'POST',
      body: JSON.stringify(spotData),
    });
  }

  async updateSpot(id, spotData) {
    return this.request(`/api/spots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(spotData),
    });
  }

  async deleteSpot(id) {
    return this.request(`/api/spots/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }
}

export const apiService = new ApiService();