export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      api_keys: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          key_hash: string
          last_used_at: string | null
          name: string
          owner: string | null
          scope: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          key_hash: string
          last_used_at?: string | null
          name: string
          owner?: string | null
          scope: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          key_hash?: string
          last_used_at?: string | null
          name?: string
          owner?: string | null
          scope?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          article_css: string | null
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          inner_links: Json | null
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          outer_links: Json | null
          priority: string | null
          published_at: string | null
          scheduled_at: string | null
          slug: string
          status: string | null
          template_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          article_css?: string | null
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          inner_links?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          outer_links?: Json | null
          priority?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          slug: string
          status?: string | null
          template_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          article_css?: string | null
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          inner_links?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          outer_links?: Json | null
          priority?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          slug?: string
          status?: string | null
          template_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_log: {
        Row: {
          created_at: string | null
          estimated_cost_usd: number | null
          id: string
          input_tokens: number | null
          model: string
          output_tokens: number | null
          translation_id: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          model: string
          output_tokens?: number | null
          translation_id?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          model?: string
          output_tokens?: number | null
          translation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_log_translation_id_fkey"
            columns: ["translation_id"]
            isOneToOne: false
            referencedRelation: "translations"
            referencedColumns: ["id"]
          },
        ]
      }
      image_translation_cache: {
        Row: {
          classification: Json | null
          created_at: string | null
          id: string
          image_hash: string
          rendered_url: string | null
          target_locale: string
          translated_slots: Json | null
        }
        Insert: {
          classification?: Json | null
          created_at?: string | null
          id?: string
          image_hash: string
          rendered_url?: string | null
          target_locale: string
          translated_slots?: Json | null
        }
        Update: {
          classification?: Json | null
          created_at?: string | null
          id?: string
          image_hash?: string
          rendered_url?: string | null
          target_locale?: string
          translated_slots?: Json | null
        }
        Relationships: []
      }
      indexing_stats: {
        Row: {
          avg_ctr: number | null
          avg_position: number | null
          created_at: string | null
          date: string
          id: string
          site_config_id: string | null
          total_clicks: number | null
          total_impressions: number | null
        }
        Insert: {
          avg_ctr?: number | null
          avg_position?: number | null
          created_at?: string | null
          date: string
          id?: string
          site_config_id?: string | null
          total_clicks?: number | null
          total_impressions?: number | null
        }
        Update: {
          avg_ctr?: number | null
          avg_position?: number | null
          created_at?: string | null
          date?: string
          id?: string
          site_config_id?: string | null
          total_clicks?: number | null
          total_impressions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "indexing_stats_site_config_id_fkey"
            columns: ["site_config_id"]
            isOneToOne: false
            referencedRelation: "site_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          article_id: string
          country_code: string
          created_at: string | null
          id: string
          language_code: string
          primary_keyword: string
          search_volume: number | null
          secondary_keywords: Json | null
          source: string | null
        }
        Insert: {
          article_id: string
          country_code: string
          created_at?: string | null
          id?: string
          language_code: string
          primary_keyword: string
          search_volume?: number | null
          secondary_keywords?: Json | null
          source?: string | null
        }
        Update: {
          article_id?: string
          country_code?: string
          created_at?: string | null
          id?: string
          language_code?: string
          primary_keyword?: string
          search_volume?: number | null
          secondary_keywords?: Json | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keywords_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      publish_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          indexnow_pinged: boolean | null
          indexnow_response: Json | null
          page_url: string | null
          site_config_id: string | null
          translation_id: string | null
          vercel_revalidation_triggered: boolean | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          indexnow_pinged?: boolean | null
          indexnow_response?: Json | null
          page_url?: string | null
          site_config_id?: string | null
          translation_id?: string | null
          vercel_revalidation_triggered?: boolean | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          indexnow_pinged?: boolean | null
          indexnow_response?: Json | null
          page_url?: string | null
          site_config_id?: string | null
          translation_id?: string | null
          vercel_revalidation_triggered?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "publish_log_site_config_id_fkey"
            columns: ["site_config_id"]
            isOneToOne: false
            referencedRelation: "site_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_log_translation_id_fkey"
            columns: ["translation_id"]
            isOneToOne: false
            referencedRelation: "translations"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_queue: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          flagged_reason: string | null
          id: string
          priority: string | null
          reviewed_at: string | null
          status: string | null
          translation_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          flagged_reason?: string | null
          id?: string
          priority?: string | null
          reviewed_at?: string | null
          status?: string | null
          translation_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          flagged_reason?: string | null
          id?: string
          priority?: string | null
          reviewed_at?: string | null
          status?: string | null
          translation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_queue_translation_id_fkey"
            columns: ["translation_id"]
            isOneToOne: false
            referencedRelation: "translations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_configs: {
        Row: {
          active: boolean | null
          adsense_publisher_id: string | null
          adsense_slot_id: string | null
          country_code: string
          created_at: string | null
          domain: string
          id: string
          indexnow_key: string | null
          language_code: string
          monetization_type: string | null
          sitemap_url: string | null
          theme_name: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          adsense_publisher_id?: string | null
          adsense_slot_id?: string | null
          country_code: string
          created_at?: string | null
          domain: string
          id?: string
          indexnow_key?: string | null
          language_code: string
          monetization_type?: string | null
          sitemap_url?: string | null
          theme_name?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          adsense_publisher_id?: string | null
          adsense_slot_id?: string | null
          country_code?: string
          created_at?: string | null
          domain?: string
          id?: string
          indexnow_key?: string | null
          language_code?: string
          monetization_type?: string | null
          sitemap_url?: string | null
          theme_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          deleted_at: string | null
          gemini_prompt: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          gemini_prompt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          gemini_prompt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          article_id: string | null
          country_code: string
          created_at: string | null
          deleted_at: string | null
          id: string
          image_texts: Json | null
          image_translation_needed: boolean | null
          inner_links: Json | null
          language_code: string
          last_error: string | null
          model_used: string | null
          outer_links: Json | null
          qa_auto_errors: Json | null
          qa_auto_passed: boolean | null
          qa_auto_warnings: Json | null
          qa_human_reviewed: boolean | null
          qa_reviewer_notes: string | null
          site_config_id: string | null
          status: string | null
          target_keywords: Json | null
          token_count: number | null
          translated_content: string | null
          translated_faq: Json | null
          translated_meta_description: string | null
          translated_meta_title: string | null
          translated_title: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          article_id?: string | null
          country_code: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_texts?: Json | null
          image_translation_needed?: boolean | null
          inner_links?: Json | null
          language_code: string
          last_error?: string | null
          model_used?: string | null
          outer_links?: Json | null
          qa_auto_errors?: Json | null
          qa_auto_passed?: boolean | null
          qa_auto_warnings?: Json | null
          qa_human_reviewed?: boolean | null
          qa_reviewer_notes?: string | null
          site_config_id?: string | null
          status?: string | null
          target_keywords?: Json | null
          token_count?: number | null
          translated_content?: string | null
          translated_faq?: Json | null
          translated_meta_description?: string | null
          translated_meta_title?: string | null
          translated_title?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          article_id?: string | null
          country_code?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_texts?: Json | null
          image_translation_needed?: boolean | null
          inner_links?: Json | null
          language_code?: string
          last_error?: string | null
          model_used?: string | null
          outer_links?: Json | null
          qa_auto_errors?: Json | null
          qa_auto_passed?: boolean | null
          qa_auto_warnings?: Json | null
          qa_human_reviewed?: boolean | null
          qa_reviewer_notes?: string | null
          site_config_id?: string | null
          status?: string | null
          target_keywords?: Json | null
          token_count?: number | null
          translated_content?: string | null
          translated_faq?: Json | null
          translated_meta_description?: string | null
          translated_meta_title?: string | null
          translated_title?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "translations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translations_site_config_id_fkey"
            columns: ["site_config_id"]
            isOneToOne: false
            referencedRelation: "site_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      // ─── Scholarship Pipeline Tables (Phase 0) ──────────────────────────────
      scholarship_records: {
        Row: {
          id: string
          name: string
          slug: string | null
          provider: string
          provider_type: string
          country: string
          target_degree: string
          disciplines: string[]
          nationality: string[]
          monthly_stipend_amount: number | null
          monthly_stipend_min_amount: number | null
          monthly_stipend_max_amount: number | null
          monthly_stipend_currency: string | null
          tuition_coverage: boolean | null
          health_insurance_covered: boolean | null
          other_benefits: string[]
          funding_type: string | null
          cycle_status: string
          active_intake_id: string | null
          max_cycle_wait_days: number
          awaiting_next_cycle_since: string | null
          source_url: string
          official_apply_url: string
          source_tier: number
          source_language: string
          fetched_at: string | null
          last_verified_at: string | null
          clean_content_hash: string | null
          semantic_record_hash: string | null
          short_description: string | null
          eligibility_summary: Json
          required_documents: string[]
          language_requirements: Json
          article_id: string | null
          article_generated: boolean
          quarantine_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          slug?: string | null
          provider: string
          provider_type: string
          country: string
          target_degree: string
          disciplines?: string[]
          nationality?: string[]
          monthly_stipend_amount?: number | null
          monthly_stipend_min_amount?: number | null
          monthly_stipend_max_amount?: number | null
          monthly_stipend_currency?: string | null
          tuition_coverage?: boolean | null
          health_insurance_covered?: boolean | null
          other_benefits?: string[]
          funding_type?: string | null
          cycle_status?: string
          active_intake_id?: string | null
          max_cycle_wait_days?: number
          awaiting_next_cycle_since?: string | null
          source_url: string
          official_apply_url: string
          source_tier: number
          source_language?: string
          fetched_at?: string | null
          last_verified_at?: string | null
          clean_content_hash?: string | null
          semantic_record_hash?: string | null
          short_description?: string | null
          eligibility_summary?: Json
          required_documents?: string[]
          language_requirements?: Json
          article_id?: string | null
          article_generated?: boolean
          quarantine_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          provider?: string
          provider_type?: string
          country?: string
          target_degree?: string
          disciplines?: string[]
          nationality?: string[]
          monthly_stipend_amount?: number | null
          monthly_stipend_min_amount?: number | null
          monthly_stipend_max_amount?: number | null
          monthly_stipend_currency?: string | null
          tuition_coverage?: boolean | null
          health_insurance_covered?: boolean | null
          other_benefits?: string[]
          funding_type?: string | null
          cycle_status?: string
          active_intake_id?: string | null
          max_cycle_wait_days?: number
          awaiting_next_cycle_since?: string | null
          source_url?: string
          official_apply_url?: string
          source_tier?: number
          source_language?: string
          fetched_at?: string | null
          last_verified_at?: string | null
          clean_content_hash?: string | null
          semantic_record_hash?: string | null
          short_description?: string | null
          eligibility_summary?: Json
          required_documents?: string[]
          language_requirements?: Json
          article_id?: string | null
          article_generated?: boolean
          quarantine_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_active_intake"
            columns: ["active_intake_id"]
            isOneToOne: false
            referencedRelation: "scholarship_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_records_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_intakes: {
        Row: {
          id: string
          scholarship_id: string
          intake_key: string
          semester: string
          cycle_label: string
          deadline: string
          program_start_date: string | null
          last_amended_at: string | null
          amendment_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          scholarship_id: string
          intake_key: string
          semester: string
          cycle_label: string
          deadline: string
          program_start_date?: string | null
          last_amended_at?: string | null
          amendment_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          scholarship_id?: string
          intake_key?: string
          semester?: string
          cycle_label?: string
          deadline?: string
          program_start_date?: string | null
          last_amended_at?: string | null
          amendment_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_intakes_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarship_records"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_article_clusters: {
        Row: {
          id: string
          scholarship_record_id: string
          cluster_status: string
          intake_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          scholarship_record_id: string
          cluster_status?: string
          intake_key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          scholarship_record_id?: string
          cluster_status?: string
          intake_key?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_article_clusters_scholarship_record_id_fkey"
            columns: ["scholarship_record_id"]
            isOneToOne: false
            referencedRelation: "scholarship_records"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_article_variants: {
        Row: {
          id: string
          cluster_id: string
          site_id: string
          locale: string
          canonical_url: string
          revalidation_endpoint: string
          isr_status: string
          isr_retry_count: number
          last_revalidated_at: string | null
          assembled_html: string | null
          seo_title: string | null
          seo_description: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cluster_id: string
          site_id: string
          locale: string
          canonical_url: string
          revalidation_endpoint: string
          isr_status?: string
          isr_retry_count?: number
          last_revalidated_at?: string | null
          assembled_html?: string | null
          seo_title?: string | null
          seo_description?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cluster_id?: string
          site_id?: string
          locale?: string
          canonical_url?: string
          revalidation_endpoint?: string
          isr_status?: string
          isr_retry_count?: number
          last_revalidated_at?: string | null
          assembled_html?: string | null
          seo_title?: string | null
          seo_description?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_article_variants_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "scholarship_article_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_article_variants_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_cluster_jobs: {
        Row: {
          id: string
          cluster_id: string
          scholarship_record_id: string
          intake_key: string
          target_locales: string[]
          build_path: string
          job_status: string
          revalidation_results: Json
          published_at: string | null
          failed_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cluster_id: string
          scholarship_record_id: string
          intake_key: string
          target_locales?: string[]
          build_path: string
          job_status?: string
          revalidation_results?: Json
          published_at?: string | null
          failed_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cluster_id?: string
          scholarship_record_id?: string
          intake_key?: string
          target_locales?: string[]
          build_path?: string
          job_status?: string
          revalidation_results?: Json
          published_at?: string | null
          failed_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_cluster_jobs_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "scholarship_article_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_cluster_jobs_scholarship_record_id_fkey"
            columns: ["scholarship_record_id"]
            isOneToOne: false
            referencedRelation: "scholarship_records"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_fetch_log: {
        Row: {
          id: string
          scholarship_record_id: string | null
          source_url: string
          source_tier: number | null
          http_status: number | null
          engine_used: string | null
          fetch_error: string | null
          clean_content_hash_before: string | null
          clean_content_hash_after: string | null
          stage1_changed: boolean | null
          semantic_hash_before: string | null
          semantic_hash_after: string | null
          stage2_changed: boolean | null
          extraction_triggered: boolean
          article_rebuild_triggered: boolean
          build_path: string | null
          fetched_at: string
        }
        Insert: {
          id?: string
          scholarship_record_id?: string | null
          source_url: string
          source_tier?: number | null
          http_status?: number | null
          engine_used?: string | null
          fetch_error?: string | null
          clean_content_hash_before?: string | null
          clean_content_hash_after?: string | null
          stage1_changed?: boolean | null
          semantic_hash_before?: string | null
          semantic_hash_after?: string | null
          stage2_changed?: boolean | null
          extraction_triggered?: boolean
          article_rebuild_triggered?: boolean
          build_path?: string | null
          fetched_at?: string
        }
        Update: {
          id?: string
          scholarship_record_id?: string | null
          source_url?: string
          source_tier?: number | null
          http_status?: number | null
          engine_used?: string | null
          fetch_error?: string | null
          clean_content_hash_before?: string | null
          clean_content_hash_after?: string | null
          stage1_changed?: boolean | null
          semantic_hash_before?: string | null
          semantic_hash_after?: string | null
          stage2_changed?: boolean | null
          extraction_triggered?: boolean
          article_rebuild_triggered?: boolean
          build_path?: string | null
          fetched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_fetch_log_scholarship_record_id_fkey"
            columns: ["scholarship_record_id"]
            isOneToOne: false
            referencedRelation: "scholarship_records"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarship_quarantine: {
        Row: {
          id: string
          scholarship_record_id: string | null
          source_url: string
          source_tier: number | null
          failure_reason: string
          failure_details: Json
          raw_evidence: Json
          extracted_record: Json | null
          review_status: string
          reviewed_by: string | null
          reviewer_notes: string | null
          reviewed_at: string | null
          requeued_job_id: string | null
          quarantined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          scholarship_record_id?: string | null
          source_url: string
          source_tier?: number | null
          failure_reason: string
          failure_details?: Json
          raw_evidence?: Json
          extracted_record?: Json | null
          review_status?: string
          reviewed_by?: string | null
          reviewer_notes?: string | null
          reviewed_at?: string | null
          requeued_job_id?: string | null
          quarantined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          scholarship_record_id?: string | null
          source_url?: string
          source_tier?: number | null
          failure_reason?: string
          failure_details?: Json
          raw_evidence?: Json
          extracted_record?: Json | null
          review_status?: string
          reviewed_by?: string | null
          reviewer_notes?: string | null
          reviewed_at?: string | null
          requeued_job_id?: string | null
          quarantined_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_quarantine_scholarship_record_id_fkey"
            columns: ["scholarship_record_id"]
            isOneToOne: false
            referencedRelation: "scholarship_records"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {

      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

