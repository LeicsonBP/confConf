export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_kind: string
          actor_user_id: string | null
          at: string
          entity: string | null
          entity_id: string | null
          id: number
          ip_hash: string | null
          metadata: Json
        }
        Insert: {
          action: string
          actor_kind: string
          actor_user_id?: string | null
          at?: string
          entity?: string | null
          entity_id?: string | null
          id?: number
          ip_hash?: string | null
          metadata?: Json
        }
        Update: {
          action?: string
          actor_kind?: string
          actor_user_id?: string | null
          at?: string
          entity?: string | null
          entity_id?: string | null
          id?: number
          ip_hash?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      draw_runs: {
        Row: {
          algorithm: string
          event_id: string
          executed_at: string
          executed_by: string | null
          participant_count: number
          rng_source: string
        }
        Insert: {
          algorithm?: string
          event_id: string
          executed_at?: string
          executed_by?: string | null
          participant_count: number
          rng_source?: string
        }
        Update: {
          algorithm?: string
          event_id?: string
          executed_at?: string
          executed_by?: string | null
          participant_count?: number
          rng_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "draw_runs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          confirmed_draw_at: string | null
          dietary_other: string | null
          dietary_restrictions: Database["public"]["Enums"]["dietary_restriction"][]
          event_id: string
          id: string
          joined_at: string
          removed_at: string | null
          user_id: string
        }
        Insert: {
          confirmed_draw_at?: string | null
          dietary_other?: string | null
          dietary_restrictions?: Database["public"]["Enums"]["dietary_restriction"][]
          event_id: string
          id?: string
          joined_at?: string
          removed_at?: string | null
          user_id: string
        }
        Update: {
          confirmed_draw_at?: string | null
          dietary_other?: string | null
          dietary_restrictions?: Database["public"]["Enums"]["dietary_restriction"][]
          event_id?: string
          id?: string
          joined_at?: string
          removed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          description: string | null
          extra_info: string | null
          has_secret_santa: boolean
          id: string
          location: string | null
          max_gift_cents: number | null
          name: string
          starts_at: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          extra_info?: string | null
          has_secret_santa?: boolean
          id?: string
          location?: string | null
          max_gift_cents?: number | null
          name: string
          starts_at: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          extra_info?: string | null
          has_secret_santa?: boolean
          id?: string
          location?: string | null
          max_gift_cents?: number | null
          name?: string
          starts_at?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: string
          expires_at: string
          id: string
          label: string | null
          last_used_at: string | null
          max_uses: number | null
          revoked_at: string | null
          token_ciphertext: string | null
          token_hash: string
          used_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id: string
          expires_at?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          max_uses?: number | null
          revoked_at?: string | null
          token_ciphertext?: string | null
          token_hash: string
          used_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: string
          expires_at?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          max_uses?: number | null
          revoked_at?: string | null
          token_ciphertext?: string | null
          token_hash?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_reports: {
        Row: {
          admin_note: string | null
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          event_id: string
          id: string
          message: string
          participant_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          admin_note?: string | null
          category: Database["public"]["Enums"]["report_category"]
          created_at?: string
          event_id: string
          id?: string
          message: string
          participant_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          admin_note?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          event_id?: string
          id?: string
          message?: string
          participant_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "problem_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problem_reports_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string
          created_at: string
          full_name: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          full_name: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      secret_santa_assignments: {
        Row: {
          created_at: string
          event_id: string
          giver_participant_id: string
          receiver_participant_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          giver_participant_id: string
          receiver_participant_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          giver_participant_id?: string
          receiver_participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_santa_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_santa_assignments_giver_participant_id_fkey"
            columns: ["giver_participant_id"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_santa_assignments_receiver_participant_id_fkey"
            columns: ["receiver_participant_id"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          participant_id: string
          priority: number
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          participant_id: string
          priority?: number
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          participant_id?: string
          priority?: number
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_assignments: { Args: { p_event: string }; Returns: Json }
      admin_remove_participant: {
        Args: { p_event: string; p_participant: string }
        Returns: undefined
      }
      am_i_admin: { Args: never; Returns: boolean }
      bootstrap_admin: {
        Args: { p_note?: string; p_user_id: string }
        Returns: undefined
      }
      confirm_draw: { Args: { p_event: string }; Returns: undefined }
      get_my_assignment: { Args: { p_event: string }; Returns: Json }
      invite_preview: { Args: { p_token_hash: string }; Returns: Json }
      recovery_throttle: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: {
          allowed: boolean
          retry_after_seconds: number
        }[]
      }
      recovery_throttle_reset: { Args: { p_key: string }; Returns: undefined }
      redeem_invite: {
        Args: {
          p_birth_date: string
          p_full_name: string
          p_other: string
          p_restrictions: string[]
          p_token_hash: string
          p_username: string
        }
        Returns: string
      }
      run_draw: { Args: { p_event: string }; Returns: undefined }
    }
    Enums: {
      dietary_restriction:
        | "vegetariano"
        | "vegano"
        | "sem_lactose"
        | "sem_gluten"
        | "outra"
      report_category: "recebi_eu_mesmo" | "nao_recebi" | "outro"
      report_status: "aberto" | "em_analise" | "resolvido" | "descartado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      dietary_restriction: [
        "vegetariano",
        "vegano",
        "sem_lactose",
        "sem_gluten",
        "outra",
      ],
      report_category: ["recebi_eu_mesmo", "nao_recebi", "outro"],
      report_status: ["aberto", "em_analise", "resolvido", "descartado"],
    },
  },
} as const
