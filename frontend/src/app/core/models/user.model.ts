export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string | null;
  default_address?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserRegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  default_address?: string;
}

export interface UserUpdateRequest {
  full_name?: string;
  phone?: string;
  default_address?: string;
  password?: string;
}
