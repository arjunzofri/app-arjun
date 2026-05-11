// Stub for next/server so that next-auth internals can resolve in vitest
export class NextRequest {}
export class NextResponse {}
export function headers() {
  return new Headers()
}
export function cookies() {
  return { get: () => undefined, set: () => {}, delete: () => {} }
}
