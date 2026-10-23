import { request } from './client';

export async function login(payload) {
  return request('/accounts/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signup(payload) {
  return request('/accounts/signup/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  return request('/accounts/logout/', {
    method: 'POST',
  });
}

export async function getCurrentUser() {
  return request('/accounts/me/');
}
