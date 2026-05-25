import { NextResponse } from "next/server";
import { z } from "zod";
import { createCustomer } from "@/lib/customers";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({
        customerId: "dev-mock-customer-" + Date.now(),
        persisted: false,
      });
    }

    const customer = await createCustomer(parsed.data);
    if (!customer) {
      return NextResponse.json(
        { error: "Kunde konnte nicht gespeichert werden" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      customerId: customer.id,
      persisted: true,
    });
  } catch (e) {
    console.error("customers:", e);
    return NextResponse.json(
      { error: "Speichern fehlgeschlagen" },
      { status: 500 },
    );
  }
}
