
export enum GarmentType {
  KURTA = 'Kurta',
  SHIRT = 'Shirt',
  LONG_KURTA = 'Long Kurta',
  SLIM_FIT_SHIRT = 'Slim Fit Shirt',
  DUO_VIEW = 'Kurta & Shirt Duo'
}

export enum ModelType {
  INDIAN_CLASSIC = 'Indian Classic',
  INDIAN_BEARDED = 'Indian Bearded',
  INDIAN_TRADITIONAL = 'Indian Traditional',
  INTERNATIONAL = 'International Look'
}

export enum ModelPose {
  STANDING = 'Standing',
  SITTING = 'Sitting',
  WALKING = 'Walking',
  DYNAMIC = 'Dynamic'
}

export enum ModelBackground {
  LIGHT_MINIMAL = 'Pure Light Minimalist',
  SOFT_GREY = 'Soft Studio Grey',
  NEUTRAL_BEIGE = 'Neutral Warm Beige',
  STUDIO = 'Minimalist Studio',
  LUXURY_INTERIOR = 'Luxury Interior',
  ROYAL_PALACE = 'Royal Palace',
  HERITAGE_HAVELI = 'Heritage Haveli',
  FESTIVE_COURTYARD = 'Festive Courtyard',
  MODERN_LOFT = 'Modern Loft',
  URBAN_STREET = 'Urban Street',
  CORPORATE_OFFICE = 'Corporate Office',
  YACHT_DECK = 'Luxury Yacht Deck',
  CHIC_CAFE = 'Chic Cafe'
}

export interface DrapingConfig {
  garmentType: GarmentType;
  modelType: ModelType;
  modelPose: ModelPose;
  modelBackground: ModelBackground;
  aspectRatio: string;
  fabricImage: string | null;
  bottomColor: string;
  promptNotes: string;
}

export interface GenerationResult {
  imageUrl: string;
  description: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  name: string;
}
