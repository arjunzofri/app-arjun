// Stub for next/server so that next-auth internals can resolve in vitest
export class NextRequest {}
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
