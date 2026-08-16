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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          agendada_para: string | null
          concluida_em: string | null
          created_at: string
          deal_id: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          owner_id: string | null
          tipo: Database["public"]["Enums"]["activity_type"]
          titulo: string
          updated_at: string
        }
        Insert: {
          agendada_para?: string | null
          concluida_em?: string | null
          created_at?: string
          deal_id?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          tipo?: Database["public"]["Enums"]["activity_type"]
          titulo: string
          updated_at?: string
        }
        Update: {
          agendada_para?: string | null
          concluida_em?: string | null
          created_at?: string
          deal_id?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          tipo?: Database["public"]["Enums"]["activity_type"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          created_at: string
          descricao: string | null
          estagio: Database["public"]["Enums"]["deal_stage"]
          fechamento_previsto: string | null
          id: string
          lead_id: string | null
          owner_id: string | null
          probabilidade: number | null
          titulo: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          estagio?: Database["public"]["Enums"]["deal_stage"]
          fechamento_previsto?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          probabilidade?: number | null
          titulo: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          estagio?: Database["public"]["Enums"]["deal_stage"]
          fechamento_previsto?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          probabilidade?: number | null
          titulo?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      downloads: {
        Row: {
          arquivo: string
          created_at: string
          email: string | null
          id: string
          ip: string | null
          lead_id: string | null
          recurso: string
          user_agent: string | null
        }
        Insert: {
          arquivo: string
          created_at?: string
          email?: string | null
          id?: string
          ip?: string | null
          lead_id?: string | null
          recurso: string
          user_agent?: string | null
        }
        Update: {
          arquivo?: string
          created_at?: string
          email?: string | null
          id?: string
          ip?: string | null
          lead_id?: string | null
          recurso?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downloads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cargo: string | null
          created_at: string
          email: string
          empresa: string | null
          id: string
          interesse: string | null
          mensagem: string | null
          nome: string
          notas: string | null
          origem: string | null
          owner_id: string | null
          status: Database["public"]["Enums"]["lead_status"]
          telefone: string | null
          track: Database["public"]["Enums"]["lead_track"] | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email: string
          empresa?: string | null
          id?: string
          interesse?: string | null
          mensagem?: string | null
          nome: string
          notas?: string | null
          origem?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string | null
          track?: Database["public"]["Enums"]["lead_track"] | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          interesse?: string | null
          mensagem?: string | null
          nome?: string
          notas?: string | null
          origem?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string | null
          track?: Database["public"]["Enums"]["lead_track"] | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_type:
        | "ligacao"
        | "email"
        | "reuniao"
        | "whatsapp"
        | "nota"
        | "tarefa"
      deal_stage:
        | "descoberta"
        | "diagnostico"
        | "proposta"
        | "negociacao"
        | "fechado_ganho"
        | "fechado_perdido"
      lead_status:
        | "novo"
        | "qualificando"
        | "qualificado"
        | "proposta"
        | "ganho"
        | "perdido"
        | "descartado"
      lead_track: "orbita" | "mfi" | "custos" | "prisma" | "geral"
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
      activity_type: [
        "ligacao",
        "email",
        "reuniao",
        "whatsapp",
        "nota",
        "tarefa",
      ],
      deal_stage: [
        "descoberta",
        "diagnostico",
        "proposta",
        "negociacao",
        "fechado_ganho",
        "fechado_perdido",
      ],
      lead_status: [
        "novo",
        "qualificando",
        "qualificado",
        "proposta",
        "ganho",
        "perdido",
        "descartado",
      ],
      lead_track: ["orbita", "mfi", "custos", "prisma", "geral"],
    },
  },
} as const
