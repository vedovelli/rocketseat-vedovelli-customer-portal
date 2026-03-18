import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { betterAuth } from "better-auth"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "@/db"
import * as schema from "@/db/schema"

// BetterAuth usa scrypt por padrão (N=16384, r=16) que excede os limites de CPU
// do Cloudflare Workers e causa timeout. Substituímos por PBKDF2 via WebCrypto API
// — nativo no Cloudflare e não contabilizado contra o limite de CPU.
//
// Trade-off: OWASP recomenda 600k iterações para PBKDF2-SHA-256. Usamos esse valor
// pois o WebCrypto é hardware-accelerated no Cloudflare e não consome CPU quota.

const PBKDF2_ITERATIONS = 600_000
const PBKDF2_MAX_ITERATIONS = 600_000 // cap para validação ao verificar hashes existentes

function hexEncode(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function hexDecode(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string: odd length")
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)
  if (aBytes.length !== bBytes.length) return false
  // Usa a implementação nativa do Cloudflare Workers (não contabiliza CPU time)
  return crypto.subtle.timingSafeEqual(aBytes, bBytes)
}

async function edgeHashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    key,
    512,
  )
  return `pbkdf2:${PBKDF2_ITERATIONS}:${hexEncode(salt)}:${hexEncode(new Uint8Array(bits))}`
}

async function edgeVerifyPassword({
  hash,
  password,
}: {
  hash: string
  password: string
}): Promise<boolean> {
  if (hash.startsWith("pbkdf2:")) {
    const parts = hash.split(":")
    if (parts.length !== 4) return false
    const [, iterStr, saltHex, keyHex] = parts

    // Valida e limita iterações para evitar DoS via hash adulterado no banco
    const iterations = Math.min(parseInt(iterStr, 10), PBKDF2_MAX_ITERATIONS)
    if (!Number.isFinite(iterations) || iterations <= 0) return false

    const salt = hexDecode(saltHex)
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password.normalize("NFKC")),
      "PBKDF2",
      false,
      ["deriveBits"],
    )
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations },
      key,
      512,
    )
    return timingSafeEqual(hexEncode(new Uint8Array(bits)), keyHex)
  }
  // Hashes scrypt legados não são suportados no Workers — usuário precisa redefinir senha.
  return false
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: edgeHashPassword,
      verify: edgeVerifyPassword,
    },
  },
  user: {
    additionalFields: {
      customerId: {
        type: "number",
        required: false,
        input: false,
      },
    },
  },
  plugins: [
    tanstackStartCookies(), // deve ser o ultimo plugin
  ],
})
