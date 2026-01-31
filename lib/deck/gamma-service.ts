/**
 * Gamma API Service
 * Handles communication with Gamma Generate API (v1.0)
 *
 * Gamma v1.0 generation is ASYNCHRONOUS:
 * - POST returns only generationId
 * - GET /generations/{generationId} returns status and result
 */

const GAMMA_API_URL = 'https://public-api.gamma.app/v1.0/generations'

export interface GammaGenerateResponse {
  generationId: string
}

export interface GammaStatusResponse {
  generationId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'error'
  gammaUrl?: string
  id?: string
  url?: string
  pptxUrl?: string
  error?: string
  credits?: {
    deducted?: number
    remaining?: number
  }
}

/**
 * Starts a deck generation using Gamma API (asynchronous)
 *
 * @param inputText - Human-readable structured narrative (not JSON, not markdown)
 * @returns Promise with generationId (use this to check status)
 */
export async function generateDeckWithGamma(
  inputText: string
): Promise<{ generationId: string }> {
  const apiKey = process.env.GAMMA_API_KEY

  if (!apiKey) {
    throw new Error('GAMMA_API_KEY environment variable is not set')
  }

  const requestBody = {
    inputText,
    textMode: 'generate' as const,
  }

  const response = await fetch(GAMMA_API_URL, {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Gamma API error: ${response.status} ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage =
        errorJson.error ??
        errorJson.message ??
        errorJson.detail ??
        errorJson.description ??
        errorMessage
    } catch {
      if (errorText) errorMessage += ` - ${errorText}`
    }
    if (response.status === 429) {
      throw new Error('Gamma API rate limit exceeded. Please try again later.')
    }
    throw new Error(errorMessage)
  }

  const data: GammaGenerateResponse = await response.json()
  if (!data.generationId) {
    throw new Error(
      `Gamma API response missing generationId. Got: ${JSON.stringify(data)}`
    )
  }
  return { generationId: data.generationId }
}

/**
 * Checks the status of a Gamma generation
 */
export async function checkGammaGenerationStatus(
  generationId: string
): Promise<GammaStatusResponse> {
  const apiKey = process.env.GAMMA_API_KEY
  if (!apiKey) {
    throw new Error('GAMMA_API_KEY environment variable is not set')
  }

  const statusUrl = `${GAMMA_API_URL}/${generationId}`
  const response = await fetch(statusUrl, {
    method: 'GET',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Gamma API status check error: ${response.status} ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage =
        errorJson.error ??
        errorJson.message ??
        errorJson.detail ??
        errorJson.description ??
        errorMessage
    } catch {
      if (errorText) errorMessage += ` - ${errorText}`
    }
    throw new Error(errorMessage)
  }

  return response.json()
}
