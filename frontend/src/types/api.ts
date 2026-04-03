// Type definitions for API responses
export interface Spot {
  spot_id: number;
  spot_name: string;
  spot_type: string;
  short_description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  last_modified?: string;
  creator_name?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateSpotData {
  spot_name: string;
  spot_type: string;
  short_description?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  status?: 'active' | 'inactive' | 'pending';
}