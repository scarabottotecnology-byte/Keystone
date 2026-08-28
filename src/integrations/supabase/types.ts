// Gerado por `supabase gen types typescript`. Não edite à mão.
//
// Esquema nasce na FASE 2: organizations, profiles, memberships, audit_log,
// idempotency_keys — RLS habilitada e forçada em todas (docs/02-MODELO-DE-DADOS.md).
// FASE 3 acrescenta growth_score_config, growth_score_snapshots e as RPCs
// rpc_command_center/rpc_next_best_actions. FASE 4 acrescenta o núcleo de IA e
// observabilidade (ai_providers, ai_prompts, ai_invocations, a view
// ai_usage_daily, automation_definitions/runs/logs, integration_logs,
// error_logs) e o domínio de conteúdo (market_intelligence_sources,
// ai_insights, content_pillars, content_topics, content_formats,
// content_ideas, content_calendar_rules, content_calendar,
// content_campaigns). FASE 5 acrescenta marca e metodologia (brand_profiles,
// brand_services), a base de conhecimento com pgvector (knowledge_documents,
// knowledge_chunks), a fábrica de conteúdo (content_assets, content_reviews)
// e a RPC match_knowledge. FASE 6 acrescenta publicação em rede social
// (social_accounts, social_posts, social_post_metrics, publishing_jobs) e a
// RPC claim_publishing_job. A ponte calendário → fila acrescenta
// enqueue_due_publications e schedule_asset_publication, além das colunas
// content_calendar.enqueued_at/enqueue_error. A integração com o Buffer
// acrescenta social_accounts.integration.
//
// O schema `private` (oauth_tokens, oauth_states) NÃO aparece aqui, e é
// justamente esse o ponto: o gerador só introspecciona o que o PostgREST
// expõe, e o token de OAuth foi posto fora dessa fronteira de propósito
// (docs/07 §3). Se um dia aparecer neste arquivo, algo abriu que não devia.
//
// Regenerar depois de cada migração.

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
    PostgrestVersion: "14.17"
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
      ai_insights: {
        Row: {
          ai_invocation_id: string | null
          category: string | null
          commercial_potential: number | null
          created_at: string
          description: string
          id: string
          observed_at: string
          organization_id: string
          recommendation: string | null
          relevance: number | null
          source: string
          source_url: string
          status: string
          title: string
          type: string
        }
        Insert: {
          ai_invocation_id?: string | null
          category?: string | null
          commercial_potential?: number | null
          created_at?: string
          description: string
          id?: string
          observed_at: string
          organization_id: string
          recommendation?: string | null
          relevance?: number | null
          source: string
          source_url: string
          status?: string
          title: string
          type: string
        }
        Update: {
          ai_invocation_id?: string | null
          category?: string | null
          commercial_potential?: number | null
          created_at?: string
          description?: string
          id?: string
          observed_at?: string
          organization_id?: string
          recommendation?: string | null
          relevance?: number | null
          source?: string
          source_url?: string
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_ai_invocation_id_fkey"
            columns: ["ai_invocation_id"]
            isOneToOne: false
            referencedRelation: "ai_invocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_invocations: {
        Row: {
          cached_tokens: number | null
          correlation_id: string | null
          created_at: string
          error: string | null
          estimated_cost_usd: number | null
          fallback_from: string | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string
          operation: string
          organization_id: string
          output_tokens: number | null
          prompt_key: string | null
          prompt_version: number | null
          provider: string
          status: string
          subject_id: string | null
          subject_type: string | null
        }
        Insert: {
          cached_tokens?: number | null
          correlation_id?: string | null
          created_at?: string
          error?: string | null
          estimated_cost_usd?: number | null
          fallback_from?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model: string
          operation: string
          organization_id: string
          output_tokens?: number | null
          prompt_key?: string | null
          prompt_version?: number | null
          provider: string
          status: string
          subject_id?: string | null
          subject_type?: string | null
        }
        Update: {
          cached_tokens?: number | null
          correlation_id?: string | null
          created_at?: string
          error?: string | null
          estimated_cost_usd?: number | null
          fallback_from?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string
          operation?: string
          organization_id?: string
          output_tokens?: number | null
          prompt_key?: string | null
          prompt_version?: number | null
          provider?: string
          status?: string
          subject_id?: string | null
          subject_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_invocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          model_hint: string | null
          organization_id: string | null
          output_schema: Json | null
          system_prompt: string
          temperature: number | null
          user_template: string
          variables: string[]
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          model_hint?: string | null
          organization_id?: string | null
          output_schema?: Json | null
          system_prompt: string
          temperature?: number | null
          user_template: string
          variables?: string[]
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          model_hint?: string | null
          organization_id?: string | null
          output_schema?: Json | null
          system_prompt?: string
          temperature?: number | null
          user_template?: string
          variables?: string[]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          config: Json
          id: string
          is_active: boolean
          key: string
          organization_id: string
          priority: number
        }
        Insert: {
          config?: Json
          id?: string
          is_active?: boolean
          key: string
          organization_id: string
          priority?: number
        }
        Update: {
          config?: Json
          id?: string
          is_active?: boolean
          key?: string
          organization_id?: string
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_providers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      automation_definitions: {
        Row: {
          approval_mode: Database["public"]["Enums"]["approval_mode"]
          config: Json
          description: string | null
          id: string
          is_enabled: boolean
          key: string
          name: string
          organization_id: string
          schedule_cron: string | null
          timezone: string
        }
        Insert: {
          approval_mode?: Database["public"]["Enums"]["approval_mode"]
          config?: Json
          description?: string | null
          id?: string
          is_enabled?: boolean
          key: string
          name: string
          organization_id: string
          schedule_cron?: string | null
          timezone?: string
        }
        Update: {
          approval_mode?: Database["public"]["Enums"]["approval_mode"]
          config?: Json
          description?: string | null
          id?: string
          is_enabled?: boolean
          key?: string
          name?: string
          organization_id?: string
          schedule_cron?: string | null
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_definitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          at: string
          id: string
          level: string
          message: string
          organization_id: string
          payload: Json | null
          run_id: string
          step: string
        }
        Insert: {
          at?: string
          id?: string
          level?: string
          message: string
          organization_id: string
          payload?: Json | null
          run_id: string
          step: string
        }
        Update: {
          at?: string
          id?: string
          level?: string
          message?: string
          organization_id?: string
          payload?: Json | null
          run_id?: string
          step?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "automation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          correlation_id: string
          definition_key: string
          error_summary: string | null
          finished_at: string | null
          id: string
          items_failed: number
          items_processed: number
          items_succeeded: number
          organization_id: string
          started_at: string
          status: Database["public"]["Enums"]["run_status"]
          trigger_type: string
        }
        Insert: {
          correlation_id: string
          definition_key: string
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          items_failed?: number
          items_processed?: number
          items_succeeded?: number
          organization_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
          trigger_type: string
        }
        Update: {
          correlation_id?: string
          definition_key?: string
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          items_failed?: number
          items_processed?: number
          items_succeeded?: number
          organization_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          audience: string | null
          colors: Json
          created_at: string
          differentiators: string[] | null
          forbidden_words: string[]
          id: string
          is_active: boolean
          logo_path: string | null
          name: string
          organization_id: string
          positioning: string | null
          preferred_words: string[]
          tone: string | null
          typography: Json
          updated_at: string
        }
        Insert: {
          audience?: string | null
          colors?: Json
          created_at?: string
          differentiators?: string[] | null
          forbidden_words?: string[]
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name: string
          organization_id: string
          positioning?: string | null
          preferred_words?: string[]
          tone?: string | null
          typography?: Json
          updated_at?: string
        }
        Update: {
          audience?: string | null
          colors?: Json
          created_at?: string
          differentiators?: string[] | null
          forbidden_words?: string[]
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name?: string
          organization_id?: string
          positioning?: string | null
          preferred_words?: string[]
          tone?: string | null
          typography?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_services: {
        Row: {
          description: string | null
          icp_fit: Json | null
          id: string
          is_active: boolean
          is_proprietary: boolean
          methodology: string | null
          name: string
          organization_id: string
          slug: string
          target_pain: string | null
        }
        Insert: {
          description?: string | null
          icp_fit?: Json | null
          id?: string
          is_active?: boolean
          is_proprietary?: boolean
          methodology?: string | null
          name: string
          organization_id: string
          slug: string
          target_pain?: string | null
        }
        Update: {
          description?: string | null
          icp_fit?: Json | null
          id?: string
          is_active?: boolean
          is_proprietary?: boolean
          methodology?: string | null
          name?: string
          organization_id?: string
          slug?: string
          target_pain?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_assets: {
        Row: {
          ai_generated: boolean
          approved_at: string | null
          approved_by: string | null
          body: string | null
          campaign_id: string | null
          channel: Database["public"]["Enums"]["social_channel"]
          created_at: string
          cta: string | null
          format_id: string | null
          grounded_on: Json
          hashtags: string[]
          headline: string | null
          hook: string | null
          id: string
          idea_id: string | null
          media: Json
          model: string | null
          organization_id: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          variant_of: string | null
          version: number
          visual_brief: string | null
        }
        Insert: {
          ai_generated?: boolean
          approved_at?: string | null
          approved_by?: string | null
          body?: string | null
          campaign_id?: string | null
          channel: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          cta?: string | null
          format_id?: string | null
          grounded_on?: Json
          hashtags?: string[]
          headline?: string | null
          hook?: string | null
          id?: string
          idea_id?: string | null
          media?: Json
          model?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          variant_of?: string | null
          version?: number
          visual_brief?: string | null
        }
        Update: {
          ai_generated?: boolean
          approved_at?: string | null
          approved_by?: string | null
          body?: string | null
          campaign_id?: string | null
          channel?: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          cta?: string | null
          format_id?: string | null
          grounded_on?: Json
          hashtags?: string[]
          headline?: string | null
          hook?: string | null
          id?: string
          idea_id?: string | null
          media?: Json
          model?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          variant_of?: string | null
          version?: number
          visual_brief?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "content_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_assets_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "content_formats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_assets_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_assets_variant_of_fkey"
            columns: ["variant_of"]
            isOneToOne: false
            referencedRelation: "content_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          asset_id: string | null
          channel: Database["public"]["Enums"]["social_channel"]
          created_at: string
          enqueue_error: string | null
          enqueued_at: string | null
          id: string
          notes: string | null
          organization_id: string
          rule_id: string | null
          scheduled_for: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          channel: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          enqueue_error?: string | null
          enqueued_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          rule_id?: string | null
          scheduled_for: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          channel?: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          enqueue_error?: string | null
          enqueued_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          rule_id?: string | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "content_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "content_calendar_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar_rules: {
        Row: {
          channel: Database["public"]["Enums"]["social_channel"]
          format_id: string | null
          id: string
          intent: string | null
          is_active: boolean
          organization_id: string
          pillar_id: string | null
          slot_time: string
          weekday: number
        }
        Insert: {
          channel: Database["public"]["Enums"]["social_channel"]
          format_id?: string | null
          id?: string
          intent?: string | null
          is_active?: boolean
          organization_id: string
          pillar_id?: string | null
          slot_time: string
          weekday: number
        }
        Update: {
          channel?: Database["public"]["Enums"]["social_channel"]
          format_id?: string | null
          id?: string
          intent?: string | null
          is_active?: boolean
          organization_id?: string
          pillar_id?: string | null
          slot_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_rules_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "content_formats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_rules_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "content_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      content_campaigns: {
        Row: {
          budget: number | null
          created_at: string
          end_at: string | null
          id: string
          name: string
          objective: string | null
          organization_id: string
          start_at: string | null
          status: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          end_at?: string | null
          id?: string
          name: string
          objective?: string | null
          organization_id: string
          start_at?: string | null
          status?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          end_at?: string | null
          id?: string
          name?: string
          objective?: string | null
          organization_id?: string
          start_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_formats: {
        Row: {
          channel: Database["public"]["Enums"]["social_channel"]
          id: string
          is_active: boolean
          key: string
          organization_id: string
          spec: Json
        }
        Insert: {
          channel: Database["public"]["Enums"]["social_channel"]
          id?: string
          is_active?: boolean
          key: string
          organization_id: string
          spec?: Json
        }
        Update: {
          channel?: Database["public"]["Enums"]["social_channel"]
          id?: string
          is_active?: boolean
          key?: string
          organization_id?: string
          spec?: Json
        }
        Relationships: [
          {
            foreignKeyName: "content_formats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_ideas: {
        Row: {
          ai_generated: boolean
          angle: string | null
          created_at: string
          created_by: string | null
          hook: string | null
          id: string
          intent: string | null
          organization_id: string
          pillar_id: string | null
          rationale: string | null
          score: number | null
          source_insight_id: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          angle?: string | null
          created_at?: string
          created_by?: string | null
          hook?: string | null
          id?: string
          intent?: string | null
          organization_id: string
          pillar_id?: string | null
          rationale?: string | null
          score?: number | null
          source_insight_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          angle?: string | null
          created_at?: string
          created_by?: string | null
          hook?: string | null
          id?: string
          intent?: string | null
          organization_id?: string
          pillar_id?: string | null
          rationale?: string | null
          score?: number | null
          source_insight_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_ideas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ideas_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "content_pillars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ideas_source_insight_id_fkey"
            columns: ["source_insight_id"]
            isOneToOne: false
            referencedRelation: "ai_insights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ideas_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "content_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pillars: {
        Row: {
          description: string | null
          id: string
          is_active: boolean
          methodology_id: string | null
          name: string
          organization_id: string
          slug: string
          weight: number
        }
        Insert: {
          description?: string | null
          id?: string
          is_active?: boolean
          methodology_id?: string | null
          name: string
          organization_id: string
          slug: string
          weight?: number
        }
        Update: {
          description?: string | null
          id?: string
          is_active?: boolean
          methodology_id?: string | null
          name?: string
          organization_id?: string
          slug?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_pillars_methodology_id_fkey"
            columns: ["methodology_id"]
            isOneToOne: false
            referencedRelation: "brand_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pillars_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reviews: {
        Row: {
          asset_id: string
          created_at: string
          dimensions: Json
          id: string
          issues: Json
          model: string | null
          organization_id: string
          reviewer_id: string | null
          reviewer_type: string
          score: number
          suggestions: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          dimensions: Json
          id?: string
          issues?: Json
          model?: string | null
          organization_id: string
          reviewer_id?: string | null
          reviewer_type?: string
          score: number
          suggestions?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          dimensions?: Json
          id?: string
          issues?: Json
          model?: string | null
          organization_id?: string
          reviewer_id?: string | null
          reviewer_type?: string
          score?: number
          suggestions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_reviews_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "content_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_topics: {
        Row: {
          description: string | null
          id: string
          organization_id: string
          pillar_id: string
          status: string
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          organization_id: string
          pillar_id: string
          status?: string
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          organization_id?: string
          pillar_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_topics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_topics_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "content_pillars"
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
      error_logs: {
        Row: {
          context: Json | null
          correlation_id: string | null
          first_seen_at: string
          id: string
          last_seen_at: string
          message: string
          occurrences: number
          organization_id: string | null
          resolved_at: string | null
          severity: string
          source: string
          stack_hash: string
        }
        Insert: {
          context?: Json | null
          correlation_id?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          message: string
          occurrences?: number
          organization_id?: string | null
          resolved_at?: string | null
          severity: string
          source: string
          stack_hash: string
        }
        Update: {
          context?: Json | null
          correlation_id?: string | null
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          message?: string
          occurrences?: number
          organization_id?: string | null
          resolved_at?: string | null
          severity?: string
          source?: string
          stack_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_organization_id_fkey"
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
      integration_logs: {
        Row: {
          at: string
          correlation_id: string | null
          error_code: string | null
          error_message: string | null
          id: string
          latency_ms: number | null
          operation: string
          organization_id: string
          provider: string
          rate_limit_remaining: number | null
          request_summary: Json | null
          retry_after_s: number | null
          status_code: number | null
        }
        Insert: {
          at?: string
          correlation_id?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          operation: string
          organization_id: string
          provider: string
          rate_limit_remaining?: number | null
          request_summary?: Json | null
          retry_after_s?: number | null
          status_code?: number | null
        }
        Update: {
          at?: string
          correlation_id?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          operation?: string
          organization_id?: string
          provider?: string
          rate_limit_remaining?: number | null
          request_summary?: Json | null
          retry_after_s?: number | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json
          organization_id: string
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          byte_size: number | null
          checksum: string | null
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          indexed_at: string | null
          mime_type: string | null
          organization_id: string
          source_type: string
          source_url: string | null
          status: Database["public"]["Enums"]["knowledge_status"]
          storage_path: string | null
          title: string
        }
        Insert: {
          byte_size?: number | null
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          indexed_at?: string | null
          mime_type?: string | null
          organization_id: string
          source_type: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["knowledge_status"]
          storage_path?: string | null
          title: string
        }
        Update: {
          byte_size?: number | null
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          indexed_at?: string | null
          mime_type?: string | null
          organization_id?: string
          source_type?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["knowledge_status"]
          storage_path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      market_intelligence_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          source_type: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          source_type: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          source_type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_intelligence_sources_organization_id_fkey"
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
      publishing_jobs: {
        Row: {
          asset_id: string
          attempt: number
          calendar_id: string | null
          correlation_id: string | null
          created_at: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          organization_id: string
          run_at: string
          social_account_id: string
          status: Database["public"]["Enums"]["publish_status"]
        }
        Insert: {
          asset_id: string
          attempt?: number
          calendar_id?: string | null
          correlation_id?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          organization_id: string
          run_at: string
          social_account_id: string
          status?: Database["public"]["Enums"]["publish_status"]
        }
        Update: {
          asset_id?: string
          attempt?: number
          calendar_id?: string | null
          correlation_id?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          organization_id?: string
          run_at?: string
          social_account_id?: string
          status?: Database["public"]["Enums"]["publish_status"]
        }
        Relationships: [
          {
            foreignKeyName: "publishing_jobs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "content_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publishing_jobs_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "content_calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publishing_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publishing_jobs_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          avatar_url: string | null
          connected_by: string | null
          created_at: string
          display_name: string | null
          external_account_id: string
          id: string
          integration: string
          last_error: string | null
          last_synced_at: string | null
          organization_id: string
          provider: Database["public"]["Enums"]["social_channel"]
          scopes: string[]
          status: Database["public"]["Enums"]["account_status"]
          token_expires_at: string | null
          token_ref: string
        }
        Insert: {
          avatar_url?: string | null
          connected_by?: string | null
          created_at?: string
          display_name?: string | null
          external_account_id: string
          id?: string
          integration?: string
          last_error?: string | null
          last_synced_at?: string | null
          organization_id: string
          provider: Database["public"]["Enums"]["social_channel"]
          scopes?: string[]
          status?: Database["public"]["Enums"]["account_status"]
          token_expires_at?: string | null
          token_ref: string
        }
        Update: {
          avatar_url?: string | null
          connected_by?: string | null
          created_at?: string
          display_name?: string | null
          external_account_id?: string
          id?: string
          integration?: string
          last_error?: string | null
          last_synced_at?: string | null
          organization_id?: string
          provider?: Database["public"]["Enums"]["social_channel"]
          scopes?: string[]
          status?: Database["public"]["Enums"]["account_status"]
          token_expires_at?: string | null
          token_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_metrics: {
        Row: {
          clicks: number | null
          collected_at: string
          collected_for: string
          comments: number | null
          id: string
          impressions: number | null
          likes: number | null
          organization_id: string
          raw: Json | null
          reach: number | null
          saves: number | null
          shares: number | null
          social_post_id: string
          video_views: number | null
        }
        Insert: {
          clicks?: number | null
          collected_at?: string
          collected_for: string
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          organization_id: string
          raw?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          social_post_id: string
          video_views?: number | null
        }
        Update: {
          clicks?: number | null
          collected_at?: string
          collected_for?: string
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          organization_id?: string
          raw?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          social_post_id?: string
          video_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_post_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_metrics_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          asset_id: string | null
          channel: Database["public"]["Enums"]["social_channel"]
          created_at: string
          error: string | null
          external_post_id: string | null
          id: string
          idempotency_key: string
          organization_id: string
          permalink: string | null
          published_at: string | null
          social_account_id: string
          status: Database["public"]["Enums"]["content_status"]
        }
        Insert: {
          asset_id?: string | null
          channel: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          error?: string | null
          external_post_id?: string | null
          id?: string
          idempotency_key: string
          organization_id: string
          permalink?: string | null
          published_at?: string | null
          social_account_id: string
          status?: Database["public"]["Enums"]["content_status"]
        }
        Update: {
          asset_id?: string | null
          channel?: Database["public"]["Enums"]["social_channel"]
          created_at?: string
          error?: string | null
          external_post_id?: string | null
          id?: string
          idempotency_key?: string
          organization_id?: string
          permalink?: string | null
          published_at?: string | null
          social_account_id?: string
          status?: Database["public"]["Enums"]["content_status"]
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "content_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_usage_daily: {
        Row: {
          calls: number | null
          cost_usd: number | null
          day: string | null
          input_tokens: number | null
          model: string | null
          operation: string | null
          organization_id: string | null
          output_tokens: number | null
          provider: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_invocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      claim_publishing_job: {
        Args: { p_limit?: number; p_organization_id: string; p_worker: string }
        Returns: {
          asset_id: string
          attempt: number
          calendar_id: string | null
          correlation_id: string | null
          created_at: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          organization_id: string
          run_at: string
          social_account_id: string
          status: Database["public"]["Enums"]["publish_status"]
        }[]
        SetofOptions: {
          from: "*"
          to: "publishing_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      enqueue_due_publications: {
        Args: { p_horizon_minutes?: number; p_organization_id: string }
        Returns: {
          calendar_id: string
          job_id: string
          outcome: string
          reason: string
        }[]
      }
      match_knowledge: {
        Args: {
          p_limit?: number
          p_min_similarity?: number
          p_organization_id: string
          p_query_embedding: string
        }
        Returns: {
          chunk_id: string
          content: string
          document_id: string
          document_title: string
          similarity: number
        }[]
      }
      rpc_command_center: { Args: never; Returns: Json }
      rpc_next_best_actions: { Args: never; Returns: Json }
      schedule_asset_publication: {
        Args: { p_asset_id: string; p_notes?: string; p_scheduled_for: string }
        Returns: string
      }
    }
    Enums: {
      account_status: "connected" | "expiring" | "expired" | "revoked" | "error"
      activity_type:
        | "ligacao"
        | "email"
        | "reuniao"
        | "whatsapp"
        | "nota"
        | "tarefa"
      approval_mode: "auto" | "approval_required" | "manual"
      content_status:
        | "draft"
        | "review"
        | "approved"
        | "scheduled"
        | "published"
        | "failed"
        | "cancelled"
      deal_stage:
        | "descoberta"
        | "diagnostico"
        | "proposta"
        | "negociacao"
        | "fechado_ganho"
        | "fechado_perdido"
      knowledge_status: "uploaded" | "processing" | "indexed" | "failed"
      lead_status:
        | "novo"
        | "qualificando"
        | "qualificado"
        | "proposta"
        | "ganho"
        | "perdido"
        | "descartado"
      lead_track: "orbita" | "mfi" | "custos" | "prisma" | "geral"
      membership_status: "invited" | "active" | "suspended"
      org_role: "owner" | "admin" | "operator" | "analyst" | "viewer"
      publish_status:
        | "pending"
        | "locked"
        | "running"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "skipped"
      run_status: "running" | "succeeded" | "failed" | "partial" | "cancelled"
      social_channel:
        | "linkedin"
        | "instagram"
        | "facebook"
        | "youtube"
        | "tiktok"
        | "x"
        | "blog"
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
      account_status: ["connected", "expiring", "expired", "revoked", "error"],
      activity_type: [
        "ligacao",
        "email",
        "reuniao",
        "whatsapp",
        "nota",
        "tarefa",
      ],
      approval_mode: ["auto", "approval_required", "manual"],
      content_status: [
        "draft",
        "review",
        "approved",
        "scheduled",
        "published",
        "failed",
        "cancelled",
      ],
      deal_stage: [
        "descoberta",
        "diagnostico",
        "proposta",
        "negociacao",
        "fechado_ganho",
        "fechado_perdido",
      ],
      knowledge_status: ["uploaded", "processing", "indexed", "failed"],
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
      membership_status: ["invited", "active", "suspended"],
      org_role: ["owner", "admin", "operator", "analyst", "viewer"],
      publish_status: [
        "pending",
        "locked",
        "running",
        "succeeded",
        "failed",
        "cancelled",
        "skipped",
      ],
      run_status: ["running", "succeeded", "failed", "partial", "cancelled"],
      social_channel: [
        "linkedin",
        "instagram",
        "facebook",
        "youtube",
        "tiktok",
        "x",
        "blog",
      ],
    },
  },
} as const
