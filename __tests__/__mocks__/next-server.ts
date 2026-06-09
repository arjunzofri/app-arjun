// Stub for next/server so that next-auth internals can resolve in vitest
export class NextRequest {
  nextUrl: URL
  headers: Headers

  constructor(input: string | URL, init?: RequestInit) {
    this.nextUrl = new URL(typeof input === 'string' ? input : input.toString())
    this.headers = new Headers(init?.headers)
  }
}

export class NextResponse {
  static json(data: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    })
  }
}

export function headers() {
  return new Headers()
}

export function cookies() {
  return { get: () => undefined, set: () => {}, delete: () => {} }
}
