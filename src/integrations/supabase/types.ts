// Gerado por `supabase gen types typescript`. Não edite à mão.
//
// Esquema nasce na FASE 2: organizations, profiles, memberships, audit_log,
// idempotency_keys — RLS habilitada e forçada em todas (docs/02-MODELO-DE-DADOS.md).
// FASE 3 acrescenta growth_score_config, growth_score_snapshots e as RPCs
// rpc_command_center/rpc_next_best_actions. Regenerar depois de cada migração.

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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          after: Json | null
          at: string
          before: Json | null
          correlation_id: string | null
          id: string
          ip_hash: string | null
          organization_id: string
          subject_id: string | null
          subject_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          after?: Json | null
          at?: string
          before?: Json | null
          correlation_id?: string | null
          id?: string
          ip_hash?: string | null
          organization_id: string
          subject_id?: string | null
          subject_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          after?: Json | null
          at?: string
          before?: Json | null
          correlation_id?: string | null
          id?: string
          ip_hash?: string | null
          organization_id?: string
          subject_id?: string | null
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_score_config: {
        Row: {
          content_target: number | null
          content_weight: number
          conversion_target: number | null
          conversion_weight: number
          created_at: string
          leads_target: number | null
          leads_weight: number
          organization_id: string
          pipeline_target: number | null
          pipeline_weight: number
          prospecting_target: number | null
          prospecting_weight: number
          revenue_target: number | null
          revenue_weight: number
          updated_at: string
        }
        Insert: {
          content_target?: number | null
          content_weight?: number
          conversion_target?: number | null
          conversion_weight?: number
          created_at?: string
          leads_target?: number | null
          leads_weight?: number
          organization_id: string
          pipeline_target?: number | null
          pipeline_weight?: number
          prospecting_target?: number | null
          prospecting_weight?: number
          revenue_target?: number | null
          revenue_weight?: number
          updated_at?: string
        }
        Update: {
          content_target?: number | null
          content_weight?: number
          conversion_target?: number | null
          conversion_weight?: number
          created_at?: string
          leads_target?: number | null
          leads_weight?: number
          organization_id?: string
          pipeline_target?: number | null
          pipeline_weight?: number
          prospecting_target?: number | null
          prospecting_weight?: number
          revenue_target?: number | null
          revenue_weight?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_score_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_score_snapshots: {
        Row: {
          components: Json
          created_at: string
          id: string
          organization_id: string
          snapshot_date: string
          total_score: number | null
        }
        Insert: {
          components?: Json
          created_at?: string
          id?: string
          organization_id: string
          snapshot_date: string
          total_score?: number | null
        }
        Update: {
          components?: Json
          created_at?: string
          id?: string
          organization_id?: string
          snapshot_date?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_score_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string
          key: string
          organization_id: string
          result: Json | null
          scope: string
          subject_id: string | null
          subject_type: string | null
        }
        Insert: {
          created_at?: string
          key: string
          organization_id: string
          result?: Json | null
          scope: string
          subject_id?: string | null
          subject_type?: string | null
        }
        Update: {
          created_at?: string
          key?: string
          organization_id?: string
          result?: Json | null
          scope?: string
          subject_id?: string | null
          subject_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          cnpj: string | null
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          legal_name: string
          locale: string
          plan: string
          slug: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id?: string
          legal_name: string
          locale?: string
          plan?: string
          slug: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          legal_name?: string
          locale?: string
          plan?: string
          slug?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      rpc_command_center: { Args: never; Returns: Json }
      rpc_next_best_actions: { Args: never; Returns: Json }
    }
    Enums: {
      membership_status: "invited" | "active" | "suspended"
      org_role: "owner" | "admin" | "operator" | "analyst" | "viewer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      membership_status: ["invited", "active", "suspended"],
      org_role: ["owner", "admin", "operator", "analyst", "viewer"],
    },
  },
} as const
