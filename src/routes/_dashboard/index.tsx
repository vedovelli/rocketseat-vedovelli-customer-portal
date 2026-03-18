import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { customers, user } from "@/db/schema"
import { getSession } from "@/lib/session"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const getCustomerKey = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession()
  if (!session?.user.customerId) return null

  const result = await db
    .select({ customerKey: customers.customerKey })
    .from(customers)
    .where(eq(customers.id, session.user.customerId))
    .get()

  return result?.customerKey ?? null
})

export const Route = createFileRoute("/_dashboard/")({
  loader: () => getCustomerKey(),
  component: DashboardPage,
})

function DashboardPage() {
  const customerKey = Route.useLoaderData()

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <div className="grid gap-2 max-w-lg">
        <Label htmlFor="customer-key">Customer Key</Label>
        <Input
          id="customer-key"
          readOnly
          value={customerKey ?? ""}
          className="font-mono text-sm"
        />
      </div>
    </div>
  )
}
