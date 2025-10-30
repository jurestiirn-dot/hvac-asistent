import cms from './cms'

export async function login(username:string, password:string) {
  const res = await cms.login(username, password)
  if (res.jwt) {
    localStorage.setItem('jwt', res.jwt)
    localStorage.setItem('user', JSON.stringify(res.user || { username }))
    return true
  }
  return false
}

export function logout() {
  localStorage.removeItem('jwt')
  localStorage.removeItem('user')
}

export function getToken() {
  return localStorage.getItem('jwt') || null
}

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('user')||'null') } catch { return null }
}

export function isAuthenticated() { return !!getToken() }

export default { login, logout, getToken, getCurrentUser, isAuthenticated }
