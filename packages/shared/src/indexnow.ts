// pingIndexNow() — submits published URLs to IndexNow API for Bing and Yandex fast indexing

export interface IndexNowResponse {
  success: boolean
  status: number
  message?: string
}

/**
 * Pings the IndexNow API to notify search engines (Bing, Yandex, etc.) of new/updated URLs.
 */
export async function pingIndexNow(
  host: string,
  key: string,
  urlList: string[]
): Promise<IndexNowResponse> {
  if (!host || !key || urlList.length === 0) {
    return {
      success: false,
      status: 400,
      message: 'Invalid IndexNow arguments: host, key, and urlList must be provided.'
    }
  }

  const endpoint = 'https://api.indexnow.org/indexnow'
  const payload = {
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`, // Standard URL verification location required by IndexNow protocol
    urlList
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return {
        success: false,
        status: response.status,
        message: `IndexNow API returned error status. Details: ${errorText}`
      }
    }

    console.log(`[IndexNow] Pinged ${urlList.length} URLs successfully for host ${host}`)
    return {
      success: true,
      status: response.status
    }
  } catch (error: any) {
    console.error('[IndexNow] Request exception:', error.message)
    return {
      success: false,
      status: 500,
      message: error.message
    }
  }
}


