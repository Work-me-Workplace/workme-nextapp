const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

const api = {
  async get(url: string) {
    const response = await fetch(`${API_BASE_URL}${url}`)
    return response.json()
  },

  async post(url: string, data?: any) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async put(url: string, data?: any) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async delete(url: string) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
    })
    return response.json()
  },
}

export default api

