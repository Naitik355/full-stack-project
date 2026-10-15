import { request } from './client';
import type { User, LoginPayload, SignupPayload, AuthResponse } from '../types/auth';

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/accounts/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/accounts/signup/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<{ message: string }> {
  return request<{ message: string }>('/accounts/logout/', {
    method: 'POST',
  });
}

export async function getCurrentUser(): Promise<User> {
  return request<User>('/accounts/me/');
}
