import type { AttributeType } from "@/lib/attributes";

export interface SpotOperatingHour {
  day: string;
  open_time: string | null;
  close_time: string | null;
  notes: string | null;
}

export interface AttributeDefinition {
  attribute_id: number;
  name: string;
  attribute_type: AttributeType;
  allowed_values: string[];
  number_unit: string | null;
  min_value: number | null;
  max_value: number | null;
  help_text: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SpotAttribute {
  spot_attribute_id: number;
  attribute_id: number | null;
  attribute_name: string | null;
  attribute_type: AttributeType;
  value: string;
  notes: string | null;
  moderation_status: "approved" | "pending" | "rejected";
  moderation_reason: string | null;
  submitted_name: string | null;
  submitted_type: AttributeType | null;
  submitted_value: string | null;
  submitted_notes: string | null;
  submitted_allowed_values: string[];
  reviewed_at: string | null;
  reviewed_by_user_id: number | null;
  allowed_values: string[];
  number_unit: string | null;
  min_value: number | null;
  max_value: number | null;
  is_active: boolean | null;
  display_label: string;
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
  attributes?: SpotAttribute[];
  attribute_badges?: string[];
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
