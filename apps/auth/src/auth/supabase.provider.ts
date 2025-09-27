import { Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseClientProvider {
  private client: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL ?? "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
    if (!url || !key) {
      // Create a dummy client to avoid crashes; operations will fail if used without proper envs
      this.client = createClient("http://localhost", "invalid");
    } else {
      this.client = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  }

  getClient() {
    return this.client;
  }
}
