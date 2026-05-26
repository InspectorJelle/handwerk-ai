import { getCurrentUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerInput } from "@/lib/types";

export type CustomerRecord = {
  id: string;
  name: string;
  address: string;
  email: string | null;
  phone: string | null;
};

export async function createCustomer(
  input: CustomerInput,
): Promise<CustomerRecord | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("customers")
    .insert({
      user_id: userId,
      name: input.name,
      address: input.address,
      email: input.email || null,
      phone: input.phone || null,
    })
    .select("id, name, address, email, phone")
    .single();

  if (error || !data) {
    console.error("createCustomer:", error?.message, error?.code, error?.details);
    return null;
  }

  return data;
}

export async function getCustomerById(
  customerId: string,
): Promise<CustomerRecord | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, address, email, phone")
    .eq("id", customerId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    console.error("getCustomerById:", error?.message);
    return null;
  }

  return data;
}
