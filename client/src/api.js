const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function request(url, options = {}) {
  const res = await fetch(url, options)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body.error || res.statusText || 'Request failed')
    err.status = res.status
    err.body = body
    throw err
  }
  return body
}

export async function createPatient(data) {
  return request(`${BASE_URL}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export async function getPatients() {
  return request(`${BASE_URL}/patients`)
}

export async function getPatient(id) {
  return request(`${BASE_URL}/patients/${id}`)
}

export async function createVisit(data) {
  return request(`${BASE_URL}/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export async function getVisitFull(id) {
  return request(`${BASE_URL}/visits/${id}/full`)
}

export async function addStep(data) {
  return request(`${BASE_URL}/steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export async function generateSoap(data) {
  return request(`${BASE_URL}/soap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

export async function lockStep(id) {
  return request(`${BASE_URL}/steps/${id}/lock`, { method: 'PATCH' })
}

export async function logDismissal(data) {
  return request(`${BASE_URL}/steps/dismissal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}
