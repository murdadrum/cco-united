interface TokenResponse {
  access_token: string
  instance_url: string
}

let cachedToken: { token: string; instanceUrl: string; expiresAt: number } | null = null

export async function getSfToken(): Promise<{ token: string; instanceUrl: string }> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return { token: cachedToken.token, instanceUrl: cachedToken.instanceUrl }
  }

  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: process.env.SF_CLIENT_ID!,
    client_secret: process.env.SF_CLIENT_SECRET!,
    username: process.env.SF_USERNAME!,
    password: process.env.SF_PASSWORD! + (process.env.SF_SECURITY_TOKEN ?? ''),
  })

  const res = await fetch(
    `${process.env.SF_INSTANCE_URL}/services/oauth2/token`,
    { method: 'POST', body: params }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SF auth failed: ${err}`)
  }

  const data: TokenResponse = await res.json()
  cachedToken = {
    token: data.access_token,
    instanceUrl: data.instance_url,
    expiresAt: Date.now() + 60 * 60 * 1000,
  }
  return { token: cachedToken.token, instanceUrl: cachedToken.instanceUrl }
}

export function invalidateSfToken() {
  cachedToken = null
}
