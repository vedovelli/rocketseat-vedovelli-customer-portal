import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { betterAuth } from "better-auth"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "@/db"
import * as schema from "@/db/schema"

// BetterAuth usa scrypt por padrão (N=16384, r=16) que excede os limites de CPU
// do Cloudflare Workers e causa timeout. Substituímos por PBKDF2 via WebCrypto API
// — nativo no Cloudflare e não contabilizado contra o limite de CPU.

function hexEncode(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function edgeHashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iterations = 100_000
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
  return `pbkdf2:${iterations}:${hexEncode(salt)}:${hexEncode(new Uint8Array(bits))}`
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
    const salt = hexDecode(saltHex)
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password.normalize("NFKC")),
      "PBKDF2",
      false,
      ["deriveBits"],
    )
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations: parseInt(iterStr, 10) },
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
