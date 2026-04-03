// API service for communicating with the backend
import type { Spot, ApiResponse, CreateSpotData } from '../types/api';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-backend-url.vercel.app' // Replace with your actual backend URL
  : 'http://localhost:5001';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
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
  async getSpots(): Promise<ApiResponse<Spot[]>> {
    return this.request('/api/spots');
  }

  async getSpot(id: number): Promise<ApiResponse<Spot>> {
    return this.request(`/api/spots/${id}`);
  }

  async createSpot(spotData: CreateSpotData): Promise<ApiResponse<Spot>> {
    return this.request('/api/spots', {
      method: 'POST',
      body: JSON.stringify(spotData),
    });
  }

  async updateSpot(id: number, spotData: Partial<CreateSpotData>): Promise<ApiResponse<any>> {
    return this.request(`/api/spots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(spotData),
    });
  }

  async deleteSpot(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/spots/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/api/health');
  }
}

export const apiService = new ApiService();