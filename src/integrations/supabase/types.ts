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
// content_campaigns). Regenerar depois de cada migração.

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
      content_calendar: {
        Row: {
          asset_id: string | null
          channel: Database["public"]["Enums"]["social_channel"]
          created_at: string
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
            foreignKeyName: "content_pillars_organization_id_fkey"
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
      rpc_command_center: { Args: never; Returns: Json }
      rpc_next_best_actions: { Args: never; Returns: Json }
    }
    Enums: {
      approval_mode: "auto" | "approval_required" | "manual"
      content_status:
        | "draft"
        | "review"
        | "approved"
        | "scheduled"
        | "published"
        | "failed"
        | "cancelled"
      membership_status: "invited" | "active" | "suspended"
      org_role: "owner" | "admin" | "operator" | "analyst" | "viewer"
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
      membership_status: ["invited", "active", "suspended"],
      org_role: ["owner", "admin", "operator", "analyst", "viewer"],
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
