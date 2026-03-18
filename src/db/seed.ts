/**
 * Script de seed para criar usuário de teste vinculado a um customer existente.
 *
 * Uso: npx tsx src/db/seed.ts
 */
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"

async function seed() {
  const email = "admin@cogniscape.app"
  const password = "changeme123!"
  const customerId = 1 // Pallas

  console.log(`Creating user ${email} linked to customer_id=${customerId}...`)

  // Criar via BetterAuth para gerar hash correto da senha
  const { user: createdUser, error } = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: "Admin Pallas",
    },
  })

  if (error) {
    console.error("Erro ao criar usuario:", error)
    process.exit(1)
  }

  // Vincular ao customer
  await db
    .update(user)
    .set({ customerId })
    .where(eq(user.email, email))

  console.log(`Usuario criado com ID: ${createdUser.id}`)
  console.log(`Vinculado ao customer_id: ${customerId}`)
}

seed().catch(console.error)
