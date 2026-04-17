export interface SpotOperatingHour {
  day: string;
  open_time: string | null;
  close_time: string | null;
  notes: string | null;
}

export interface SpotMedia {
  media_id?: number;
  media_url: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  sort_order: number;
  is_primary: boolean;
}

export interface Spot {
  spot_id: number;
  spot_name: string;
  spot_type: string;
  short_description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "inactive" | "pending";
  created_at: string;
  last_modified: string | null;
  creator_name: string;
  creator_avatar_url?: string | null;
  user_id: number;
  average_rating: number | null;
  review_count: number;
  primary_media_url?: string | null;
  media_count?: number;
  distance_miles?: number | null;
  is_favorited?: boolean;
  favorited_at?: string | null;
  operating_hours?: SpotOperatingHour[];
  media?: SpotMedia[];
}

export interface SpotReview {
  review_id: number;
  spot_id: number;
  user_id: number;
  rating: number;
  review: string | null;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar_url?: string | null;
}
