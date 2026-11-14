export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Placeholder até a primeira geração real com:
 * `npm run db:types` (Supabase CLI, projeto vinculado).
 * O CI falha se este arquivo divergir do banco de teste.
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
