import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cliente com `service_role`. Bypassa RLS — use somente no endpoint de
 * recuperação de credenciais e em scripts de operação.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ausente: configure a variável no servidor (nunca com NEXT_PUBLIC_).",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
