export interface User {
  id: number;
  username: string;
  email: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message?: string;
  messages?: string;
  username?: string;
  error?: string;
}
