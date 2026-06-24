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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          ad_copy: string | null
          ad_variations: Json | null
          budget: number | null
          campaign_name: string
          clicks: number | null
          conversions: number | null
          cost_per_click: number | null
          cost_per_post: number | null
          created_at: string
          end_date: string | null
          geographic_coverage: string | null
          id: string
          impressions: number | null
          landing_page_url: string | null
          last_post_date: string | null
          notes: string | null
          platform: string
          post_category: string | null
          post_schedule: Json | null
          posts_count: number | null
          renewal_frequency: string | null
          roi: number | null
          spent: number | null
          start_date: string | null
          status: string
          target_audience: string | null
          template_id: string | null
          updated_at: string
          utm_parameters: Json | null
        }
        Insert: {
          ad_copy?: string | null
          ad_variations?: Json | null
          budget?: number | null
          campaign_name: string
          clicks?: number | null
          conversions?: number | null
          cost_per_click?: number | null
          cost_per_post?: number | null
          created_at?: string
          end_date?: string | null
          geographic_coverage?: string | null
          id?: string
          impressions?: number | null
          landing_page_url?: string | null
          last_post_date?: string | null
          notes?: string | null
          platform: string
          post_category?: string | null
          post_schedule?: Json | null
          posts_count?: number | null
          renewal_frequency?: string | null
          roi?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string
          target_audience?: string | null
          template_id?: string | null
          updated_at?: string
          utm_parameters?: Json | null
        }
        Update: {
          ad_copy?: string | null
          ad_variations?: Json | null
          budget?: number | null
          campaign_name?: string
          clicks?: number | null
          conversions?: number | null
          cost_per_click?: number | null
          cost_per_post?: number | null
          created_at?: string
          end_date?: string | null
          geographic_coverage?: string | null
          id?: string
          impressions?: number | null
          landing_page_url?: string | null
          last_post_date?: string | null
          notes?: string | null
          platform?: string
          post_category?: string | null
          post_schedule?: Json | null
          posts_count?: number | null
          renewal_frequency?: string | null
          roi?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string
          target_audience?: string | null
          template_id?: string | null
          updated_at?: string
          utm_parameters?: Json | null
        }
        Relationships: []
      }
      ad_post_log: {
        Row: {
          ad_variation_used: number | null
          campaign_id: string
          clicks: number | null
          cost: number | null
          created_at: string | null
          id: string
          notes: string | null
          post_date: string
          post_url: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          ad_variation_used?: number | null
          campaign_id: string
          clicks?: number | null
          cost?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          post_date?: string
          post_url?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          ad_variation_used?: number | null
          campaign_id?: string
          clicks?: number | null
          cost?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          post_date?: string
          post_url?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_post_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_templates: {
        Row: {
          ad_copy: string
          category: string | null
          created_at: string | null
          geographic_coverage: string | null
          id: string
          is_active: boolean | null
          platform: string
          target_audience: string | null
          template_name: string
          updated_at: string | null
        }
        Insert: {
          ad_copy: string
          category?: string | null
          created_at?: string | null
          geographic_coverage?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          target_audience?: string | null
          template_name: string
          updated_at?: string | null
        }
        Update: {
          ad_copy?: string
          category?: string | null
          created_at?: string | null
          geographic_coverage?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          target_audience?: string | null
          template_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bot_analytics: {
        Row: {
          chatbot_id: string | null
          conversation_id: string | null
          created_at: string | null
          deployment_source: string | null
          event_data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          chatbot_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          deployment_source?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          chatbot_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          deployment_source?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_analytics_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_analytics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_compliance: {
        Row: {
          auto_renewal: boolean | null
          category: string
          cost: number | null
          created_at: string
          document_number: string | null
          document_url: string | null
          expiration_date: string | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
          item_name: string
          notes: string | null
          reminder_days: number | null
          renewal_frequency: string | null
          responsible_person: string | null
          status: string
          updated_at: string
          vendor_provider: string | null
        }
        Insert: {
          auto_renewal?: boolean | null
          category: string
          cost?: number | null
          created_at?: string
          document_number?: string | null
          document_url?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          item_name: string
          notes?: string | null
          reminder_days?: number | null
          renewal_frequency?: string | null
          responsible_person?: string | null
          status?: string
          updated_at?: string
          vendor_provider?: string | null
        }
        Update: {
          auto_renewal?: boolean | null
          category?: string
          cost?: number | null
          created_at?: string
          document_number?: string | null
          document_url?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          item_name?: string
          notes?: string | null
          reminder_days?: number | null
          renewal_frequency?: string | null
          responsible_person?: string | null
          status?: string
          updated_at?: string
          vendor_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_compliance_responsible_person_fkey"
            columns: ["responsible_person"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_expenses: {
        Row: {
          amount: number
          categories: string[] | null
          created_at: string
          description: string | null
          expense_category: string
          id: string
          is_recurring: boolean | null
          next_due_date: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          receipt_url: string | null
          recurring_frequency: string | null
          reference_number: string | null
          status: string
          sub_category: string | null
          updated_at: string
          vendor_name: string
        }
        Insert: {
          amount: number
          categories?: string[] | null
          created_at?: string
          description?: string | null
          expense_category: string
          id?: string
          is_recurring?: boolean | null
          next_due_date?: string | null
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          receipt_url?: string | null
          recurring_frequency?: string | null
          reference_number?: string | null
          status?: string
          sub_category?: string | null
          updated_at?: string
          vendor_name: string
        }
        Update: {
          amount?: number
          categories?: string[] | null
          created_at?: string
          description?: string | null
          expense_category?: string
          id?: string
          is_recurring?: boolean | null
          next_due_date?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_url?: string | null
          recurring_frequency?: string | null
          reference_number?: string | null
          status?: string
          sub_category?: string | null
          updated_at?: string
          vendor_name?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          attendees: Json | null
          created_at: string
          description: string | null
          end_time: string
          event_type: string
          id: string
          job_id: string | null
          location: string | null
          notes: string | null
          related_contact_id: string | null
          related_contract_id: string | null
          related_lead_id: string | null
          reminder_sent: boolean | null
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: Json | null
          created_at?: string
          description?: string | null
          end_time: string
          event_type?: string
          id?: string
          job_id?: string | null
          location?: string | null
          notes?: string | null
          related_contact_id?: string | null
          related_contract_id?: string | null
          related_lead_id?: string | null
          reminder_sent?: boolean | null
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attendees?: Json | null
          created_at?: string
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          job_id?: string | null
          location?: string | null
          notes?: string | null
          related_contact_id?: string | null
          related_contract_id?: string | null
          related_lead_id?: string | null
          reminder_sent?: boolean | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_related_contact_id_fkey"
            columns: ["related_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_related_contract_id_fkey"
            columns: ["related_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_related_lead_id_fkey"
            columns: ["related_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          assigned_to: string | null
          chatbot_id: string | null
          created_at: string | null
          customer_user_id: string | null
          deployment_source: string | null
          id: string
          job_id: string | null
          metadata: Json | null
          session_id: string
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          chatbot_id?: string | null
          created_at?: string | null
          customer_user_id?: string | null
          deployment_source?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          session_id: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          chatbot_id?: string | null
          created_at?: string | null
          customer_user_id?: string | null
          deployment_source?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          session_id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          customer_user_id: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          customer_user_id?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          customer_user_id?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbots: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          system_prompt: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          system_prompt: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          system_prompt?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_renewals: {
        Row: {
          compliance_id: string
          confirmation_number: string | null
          cost: number | null
          created_at: string
          expiration_date: string
          id: string
          notes: string | null
          payment_method: string | null
          renewal_date: string
          renewed_by: string | null
        }
        Insert: {
          compliance_id: string
          confirmation_number?: string | null
          cost?: number | null
          created_at?: string
          expiration_date: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          renewal_date: string
          renewed_by?: string | null
        }
        Update: {
          compliance_id?: string
          confirmation_number?: string | null
          cost?: number | null
          created_at?: string
          expiration_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          renewal_date?: string
          renewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_renewals_compliance_id_fkey"
            columns: ["compliance_id"]
            isOneToOne: false
            referencedRelation: "business_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_renewals_renewed_by_fkey"
            columns: ["renewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          contact_type: string
          created_at: string
          email: string | null
          id: string
          last_contact_date: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          contact_type: string
          created_at?: string
          email?: string | null
          id?: string
          last_contact_date?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          contact_type?: string
          created_at?: string
          email?: string | null
          id?: string
          last_contact_date?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_snippets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          amount: number | null
          contract_number: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lead_id: string | null
          notes: string | null
          pdf_url: string | null
          sent_at: string | null
          signed_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          contract_number: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          contract_number?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_locations: {
        Row: {
          customer_user_id: string | null
          eta_minutes: number | null
          eta_window: string | null
          id: string
          job_id: string
          lat: number | null
          lng: number | null
          updated_at: string
        }
        Insert: {
          customer_user_id?: string | null
          eta_minutes?: number | null
          eta_window?: string | null
          id?: string
          job_id: string
          lat?: number | null
          lng?: number | null
          updated_at?: string
        }
        Update: {
          customer_user_id?: string | null
          eta_minutes?: number | null
          eta_window?: string | null
          id?: string
          job_id?: string
          lat?: number | null
          lng?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_locations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notifications: {
        Row: {
          body: string | null
          created_at: string
          customer_user_id: string
          id: string
          job_id: string | null
          read: boolean
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          customer_user_id: string
          id?: string
          job_id?: string | null
          read?: boolean
          title: string
          type?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          customer_user_id?: string
          id?: string
          job_id?: string | null
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_listings: {
        Row: {
          created_at: string
          directory_name: string
          directory_type: string
          id: string
          last_verified: string | null
          notes: string | null
          priority: string
          profile_url: string | null
          status: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          directory_name: string
          directory_type?: string
          id?: string
          last_verified?: string | null
          notes?: string | null
          priority?: string
          profile_url?: string | null
          status?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          directory_name?: string
          directory_type?: string
          id?: string
          last_verified?: string | null
          notes?: string | null
          priority?: string
          profile_url?: string | null
          status?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          created_at: string | null
          display_order: number | null
          document_type: string
          id: string
          is_active: boolean | null
          is_system: boolean | null
          required_for_job: boolean | null
          template_content: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          document_type: string
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          required_for_job?: boolean | null
          template_content: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          document_type?: string
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          required_for_job?: boolean | null
          template_content?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          contact_id: string | null
          created_at: string
          customer_user_id: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          file_size: number | null
          id: string
          is_generated: boolean | null
          is_signed: boolean | null
          job_id: string | null
          mime_type: string | null
          name: string
          notes: string | null
          signed_at: string | null
          signer_name: string | null
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          customer_user_id?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_path: string
          file_size?: number | null
          id?: string
          is_generated?: boolean | null
          is_signed?: boolean | null
          job_id?: string | null
          mime_type?: string | null
          name: string
          notes?: string | null
          signed_at?: string | null
          signer_name?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          customer_user_id?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_path?: string
          file_size?: number | null
          id?: string
          is_generated?: boolean | null
          is_signed?: boolean | null
          job_id?: string | null
          mime_type?: string | null
          name?: string
          notes?: string | null
          signed_at?: string | null
          signer_name?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          auto_renewal: boolean | null
          created_at: string
          dns_provider: string | null
          domain_name: string
          expiration_date: string
          google_analytics: boolean | null
          google_search_console: boolean | null
          has_landing_page: boolean | null
          id: string
          is_active: boolean | null
          landing_page_url: string | null
          nameservers: string | null
          notes: string | null
          purchase_date: string | null
          registrar: string
          registrar_account_email: string | null
          renewal_cost: number | null
          updated_at: string
        }
        Insert: {
          auto_renewal?: boolean | null
          created_at?: string
          dns_provider?: string | null
          domain_name: string
          expiration_date: string
          google_analytics?: boolean | null
          google_search_console?: boolean | null
          has_landing_page?: boolean | null
          id?: string
          is_active?: boolean | null
          landing_page_url?: string | null
          nameservers?: string | null
          notes?: string | null
          purchase_date?: string | null
          registrar: string
          registrar_account_email?: string | null
          renewal_cost?: number | null
          updated_at?: string
        }
        Update: {
          auto_renewal?: boolean | null
          created_at?: string
          dns_provider?: string | null
          domain_name?: string
          expiration_date?: string
          google_analytics?: boolean | null
          google_search_console?: boolean | null
          has_landing_page?: boolean | null
          id?: string
          is_active?: boolean | null
          landing_page_url?: string | null
          nameservers?: string | null
          notes?: string | null
          purchase_date?: string | null
          registrar?: string
          registrar_account_email?: string | null
          renewal_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_certifications: {
        Row: {
          certification_name: string
          certification_number: string | null
          certification_type: string
          created_at: string
          document_url: string | null
          employee_id: string
          expiration_date: string | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
          notes: string | null
          status: string
        }
        Insert: {
          certification_name: string
          certification_number?: string | null
          certification_type: string
          created_at?: string
          document_url?: string | null
          employee_id: string
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          status?: string
        }
        Update: {
          certification_name?: string
          certification_number?: string | null
          certification_type?: string
          created_at?: string
          document_url?: string | null
          employee_id?: string
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
          value: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
          value: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string
          category_icon: string | null
          category_order: number
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          category_icon?: string | null
          category_order?: number
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          category_icon?: string | null
          category_order?: number
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      follow_up_settings: {
        Row: {
          created_at: string
          delay_hours: number
          feature_name: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          delay_hours?: number
          feature_name: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          delay_hours?: number
          feature_name?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      fuel_logs: {
        Row: {
          cost_per_gallon: number
          created_at: string
          fill_date: string
          filled_by: string | null
          fuel_type: string
          gallons: number
          id: string
          mileage: number
          notes: string | null
          receipt_number: string | null
          station_name: string | null
          total_cost: number
          vehicle_id: string
        }
        Insert: {
          cost_per_gallon: number
          created_at?: string
          fill_date: string
          filled_by?: string | null
          fuel_type: string
          gallons: number
          id?: string
          mileage: number
          notes?: string | null
          receipt_number?: string | null
          station_name?: string | null
          total_cost: number
          vehicle_id: string
        }
        Update: {
          cost_per_gallon?: number
          created_at?: string
          fill_date?: string
          filled_by?: string | null
          fuel_type?: string
          gallons?: number
          id?: string
          mileage?: number
          notes?: string | null
          receipt_number?: string | null
          station_name?: string | null
          total_cost?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_filled_by_fkey"
            columns: ["filled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          contact_id: string | null
          contract_id: string | null
          created_at: string
          customer_user_id: string | null
          due_date: string | null
          id: string
          invoice_number: string
          job_id: string | null
          lead_id: string | null
          line_items: Json | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          status: string
          tax: number | null
          total: number
          updated_at: string
        }
        Insert: {
          amount: number
          contact_id?: string | null
          contract_id?: string | null
          created_at?: string
          customer_user_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          job_id?: string | null
          lead_id?: string | null
          line_items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          tax?: number | null
          total: number
          updated_at?: string
        }
        Update: {
          amount?: number
          contact_id?: string | null
          contract_id?: string | null
          created_at?: string
          customer_user_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          job_id?: string | null
          lead_id?: string | null
          line_items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          tax?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      job_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          id: string
          job_id: string
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          id?: string
          job_id: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          id?: string
          job_id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_activities_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          actual_total: number | null
          assigned_to: string | null
          bol_signed: boolean | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          contact_id: string | null
          created_at: string | null
          crew_members: Json | null
          crew_size: number | null
          customer_notes: string | null
          customer_user_id: string | null
          destination_access_type: string | null
          destination_address: string
          distance_miles: number | null
          documents_complete: boolean | null
          estimated_duration_hours: number | null
          estimated_total: number | null
          estimated_weight: number | null
          home_size: string | null
          hourly_rate: number | null
          id: string
          insurance_acknowledged: boolean | null
          internal_notes: string | null
          inventory_completed: boolean | null
          job_number: string
          job_type: string
          lead_id: string | null
          materials_cost: number | null
          ofs_signed: boolean | null
          origin_access_type: string | null
          origin_address: string
          packing_service_included: boolean | null
          payment_status: string | null
          pre_move_checklist_complete: boolean | null
          quote_request_id: string | null
          requires_disassembly: boolean | null
          scheduled_date: string
          scheduled_start_time: string | null
          service_category: string | null
          special_instructions: string | null
          special_items: Json | null
          status: string
          travel_fee: number | null
          truck_fee: number | null
          truck_size: string | null
          updated_at: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          actual_total?: number | null
          assigned_to?: string | null
          bol_signed?: boolean | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          crew_members?: Json | null
          crew_size?: number | null
          customer_notes?: string | null
          customer_user_id?: string | null
          destination_access_type?: string | null
          destination_address: string
          distance_miles?: number | null
          documents_complete?: boolean | null
          estimated_duration_hours?: number | null
          estimated_total?: number | null
          estimated_weight?: number | null
          home_size?: string | null
          hourly_rate?: number | null
          id?: string
          insurance_acknowledged?: boolean | null
          internal_notes?: string | null
          inventory_completed?: boolean | null
          job_number: string
          job_type: string
          lead_id?: string | null
          materials_cost?: number | null
          ofs_signed?: boolean | null
          origin_access_type?: string | null
          origin_address: string
          packing_service_included?: boolean | null
          payment_status?: string | null
          pre_move_checklist_complete?: boolean | null
          quote_request_id?: string | null
          requires_disassembly?: boolean | null
          scheduled_date: string
          scheduled_start_time?: string | null
          service_category?: string | null
          special_instructions?: string | null
          special_items?: Json | null
          status?: string
          travel_fee?: number | null
          truck_fee?: number | null
          truck_size?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          actual_total?: number | null
          assigned_to?: string | null
          bol_signed?: boolean | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          crew_members?: Json | null
          crew_size?: number | null
          customer_notes?: string | null
          customer_user_id?: string | null
          destination_access_type?: string | null
          destination_address?: string
          distance_miles?: number | null
          documents_complete?: boolean | null
          estimated_duration_hours?: number | null
          estimated_total?: number | null
          estimated_weight?: number | null
          home_size?: string | null
          hourly_rate?: number | null
          id?: string
          insurance_acknowledged?: boolean | null
          internal_notes?: string | null
          inventory_completed?: boolean | null
          job_number?: string
          job_type?: string
          lead_id?: string | null
          materials_cost?: number | null
          ofs_signed?: boolean | null
          origin_access_type?: string | null
          origin_address?: string
          packing_service_included?: boolean | null
          payment_status?: string | null
          pre_move_checklist_complete?: boolean | null
          quote_request_id?: string | null
          requires_disassembly?: boolean | null
          scheduled_date?: string
          scheduled_start_time?: string | null
          service_category?: string | null
          special_instructions?: string | null
          special_items?: Json | null
          status?: string
          travel_fee?: number | null
          truck_fee?: number | null
          truck_size?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          lead_id: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          lead_id: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          destination_address: string | null
          email: string | null
          estimated_budget: string | null
          home_type: string | null
          id: string
          last_activity: string | null
          move_date: string | null
          move_type: string | null
          name: string
          next_follow_up: string | null
          notes: string | null
          origin_address: string | null
          partner_id: string | null
          phone: string | null
          preferred_contact_method: string | null
          priority: string | null
          referral_id: string | null
          source: string
          special_requirements: string | null
          status: string
          updated_at: string
          value_estimate: number | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          destination_address?: string | null
          email?: string | null
          estimated_budget?: string | null
          home_type?: string | null
          id?: string
          last_activity?: string | null
          move_date?: string | null
          move_type?: string | null
          name: string
          next_follow_up?: string | null
          notes?: string | null
          origin_address?: string | null
          partner_id?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          priority?: string | null
          referral_id?: string | null
          source?: string
          special_requirements?: string | null
          status?: string
          updated_at?: string
          value_estimate?: number | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          destination_address?: string | null
          email?: string | null
          estimated_budget?: string | null
          home_type?: string | null
          id?: string
          last_activity?: string | null
          move_date?: string | null
          move_type?: string | null
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          origin_address?: string | null
          partner_id?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          priority?: string | null
          referral_id?: string | null
          source?: string
          special_requirements?: string | null
          status?: string
          updated_at?: string
          value_estimate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_orders: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          description: string | null
          estimated_cost: number | null
          id: string
          notes: string | null
          priority: string
          scheduled_date: string | null
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          priority?: string
          scheduled_date?: string | null
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          priority?: string
          scheduled_date?: string | null
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          folder: string | null
          id: string
          name: string
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          id?: string
          name: string
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          folder?: string | null
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      media_tags: {
        Row: {
          created_at: string
          media_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          media_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          media_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_tags_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      move_checklist_items: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_user_id: string | null
          id: string
          job_id: string
          label: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_user_id?: string | null
          id?: string
          job_id: string
          label: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_user_id?: string | null
          id?: string
          job_id?: string
          label?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "move_checklist_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      move_inventory: {
        Row: {
          category: string
          condition: string | null
          created_at: string
          customer_user_id: string | null
          fragile: boolean
          id: string
          item_name: string
          job_id: string
          notes: string | null
          photo_url: string | null
          quantity: number
          updated_at: string
        }
        Insert: {
          category: string
          condition?: string | null
          created_at?: string
          customer_user_id?: string | null
          fragile?: boolean
          id?: string
          item_name: string
          job_id: string
          notes?: string | null
          photo_url?: string | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          category?: string
          condition?: string | null
          created_at?: string
          customer_user_id?: string | null
          fragile?: boolean
          id?: string
          item_name?: string
          job_id?: string
          notes?: string | null
          photo_url?: string | null
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "move_inventory_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      page_meta: {
        Row: {
          canonical_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          meta_description: string
          meta_keywords: string | null
          meta_title: string
          og_description: string | null
          og_image: string | null
          og_title: string | null
          page_slug: string
          twitter_description: string | null
          twitter_image: string | null
          twitter_title: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          meta_description: string
          meta_keywords?: string | null
          meta_title: string
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_slug: string
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          meta_description?: string
          meta_keywords?: string | null
          meta_title?: string
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_slug?: string
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          content: Json
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          page_slug: string
          section_key: string
          section_type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          page_slug: string
          section_key: string
          section_type?: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          page_slug?: string
          section_key?: string
          section_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_settings: {
        Row: {
          created_at: string | null
          id: string
          page_slug: string
          setting_key: string
          setting_type: string | null
          setting_value: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_slug: string
          setting_key: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          page_slug?: string
          setting_key?: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      partner_payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          payment_date: string
          payment_method: string | null
          period_end: string | null
          period_start: string | null
          reference_number: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          payment_date?: string
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          reference_number?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          payment_date?: string
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          reference_number?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          commission_amount: number | null
          commission_type: string
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          partner_type: string
          phone: string | null
          referral_code: string
          referral_slug: string | null
          source: string | null
          status: string
          total_converted: number | null
          total_earned: number | null
          total_referrals: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          commission_amount?: number | null
          commission_type?: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          partner_type?: string
          phone?: string | null
          referral_code: string
          referral_slug?: string | null
          source?: string | null
          status?: string
          total_converted?: number | null
          total_earned?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          commission_amount?: number | null
          commission_type?: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          partner_type?: string
          phone?: string | null
          referral_code?: string
          referral_slug?: string | null
          source?: string | null
          status?: string
          total_converted?: number | null
          total_earned?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_intents: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_user_id: string
          id: string
          invoice_id: string | null
          job_id: string | null
          processor: string | null
          processor_intent_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_user_id: string
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          processor?: string | null
          processor_intent_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_user_id?: string
          id?: string
          invoice_id?: string | null
          job_id?: string | null
          processor?: string | null
          processor_intent_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_intents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          expo_push_token: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          expo_push_token?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          expo_push_token?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pwa_settings: {
        Row: {
          cache_strategy: string | null
          cache_version: string | null
          id: string
          offline_enabled: boolean | null
          show_install_prompt: boolean | null
          updated_at: string | null
        }
        Insert: {
          cache_strategy?: string | null
          cache_version?: string | null
          id?: string
          offline_enabled?: boolean | null
          show_install_prompt?: boolean | null
          updated_at?: string | null
        }
        Update: {
          cache_strategy?: string | null
          cache_version?: string | null
          id?: string
          offline_enabled?: boolean | null
          show_install_prompt?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          qr_image_url: string | null
          scan_count: number
          target_url: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          qr_image_url?: string | null
          scan_count?: number
          target_url: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          qr_image_url?: string | null
          scan_count?: number
          target_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          contact_id: string | null
          conversation_data: Json | null
          created_at: string
          destination: string
          estimated_price_max: number | null
          estimated_price_min: number | null
          follow_up_email_id: string | null
          follow_up_sent_at: string | null
          home_size: string
          id: string
          move_date: string | null
          origin: string
          special_items: boolean | null
          status: string | null
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          conversation_data?: Json | null
          created_at?: string
          destination: string
          estimated_price_max?: number | null
          estimated_price_min?: number | null
          follow_up_email_id?: string | null
          follow_up_sent_at?: string | null
          home_size: string
          id?: string
          move_date?: string | null
          origin: string
          special_items?: boolean | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          conversation_data?: Json | null
          created_at?: string
          destination?: string
          estimated_price_max?: number | null
          estimated_price_min?: number | null
          follow_up_email_id?: string | null
          follow_up_sent_at?: string | null
          home_size?: string
          id?: string
          move_date?: string | null
          origin?: string
          special_items?: boolean | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          referred_email: string | null
          referred_name: string
          referred_phone: string | null
          referrer_email: string | null
          referrer_name: string
          referrer_phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          referred_email?: string | null
          referred_name: string
          referred_phone?: string | null
          referrer_email?: string | null
          referrer_name: string
          referrer_phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          referred_email?: string | null
          referred_name?: string
          referred_phone?: string | null
          referrer_email?: string | null
          referrer_name?: string
          referrer_phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reschedule_requests: {
        Row: {
          arrival_window: string | null
          created_at: string
          customer_user_id: string
          id: string
          job_id: string
          reason: string | null
          requested_date: string
          staff_response: string | null
          status: string
          updated_at: string
        }
        Insert: {
          arrival_window?: string | null
          created_at?: string
          customer_user_id: string
          id?: string
          job_id: string
          reason?: string | null
          requested_date: string
          staff_response?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          arrival_window?: string | null
          created_at?: string
          customer_user_id?: string
          id?: string
          job_id?: string
          reason?: string | null
          requested_date?: string
          staff_response?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reschedule_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          is_featured: boolean | null
          location: string | null
          rating: number
          review_text: string | null
          service_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          is_featured?: boolean | null
          location?: string | null
          rating: number
          review_text?: string | null
          service_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          is_featured?: boolean | null
          location?: string | null
          rating?: number
          review_text?: string | null
          service_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      section_images: {
        Row: {
          alt_text: string | null
          compression_ratio: number | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          media_file_id: string
          original_size_kb: number | null
          section_name: string
          updated_at: string
          user_id: string
          webp_size_kb: number | null
          webp_url: string | null
        }
        Insert: {
          alt_text?: string | null
          compression_ratio?: number | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          media_file_id: string
          original_size_kb?: number | null
          section_name: string
          updated_at?: string
          user_id: string
          webp_size_kb?: number | null
          webp_url?: string | null
        }
        Update: {
          alt_text?: string | null
          compression_ratio?: number | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          media_file_id?: string
          original_size_kb?: number | null
          section_name?: string
          updated_at?: string
          user_id?: string
          webp_size_kb?: number | null
          webp_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "section_images_media_file_id_fkey"
            columns: ["media_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_checklist_items: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          is_system: boolean
          notes: string | null
          order_index: number
          priority: string
          related_page_slug: string | null
          related_url: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          completed_at?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          is_system?: boolean
          notes?: string | null
          order_index: number
          priority: string
          related_page_slug?: string | null
          related_url?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          is_system?: boolean
          notes?: string | null
          order_index?: number
          priority?: string
          related_page_slug?: string | null
          related_url?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_area_faqs: {
        Row: {
          answer: string
          created_at: string
          display_order: number
          id: string
          question: string
          service_area_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          display_order?: number
          id?: string
          question: string
          service_area_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          display_order?: number
          id?: string
          question?: string
          service_area_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_area_faqs_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      service_area_neighborhoods: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          neighborhood_type: string
          service_area_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          neighborhood_type?: string
          service_area_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          neighborhood_type?: string
          service_area_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_area_neighborhoods_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      service_area_testimonials: {
        Row: {
          created_at: string
          customer_location: string
          customer_name: string
          id: string
          is_featured: boolean
          quote: string
          rating: number
          service_area_id: string
        }
        Insert: {
          created_at?: string
          customer_location: string
          customer_name: string
          id?: string
          is_featured?: boolean
          quote: string
          rating?: number
          service_area_id: string
        }
        Update: {
          created_at?: string
          customer_location?: string
          customer_name?: string
          id?: string
          is_featured?: boolean
          quote?: string
          rating?: number
          service_area_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_area_testimonials_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      service_area_trust_factors: {
        Row: {
          created_at: string
          description: string
          display_order: number
          icon_name: string
          id: string
          service_area_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          icon_name: string
          id?: string
          service_area_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon_name?: string
          id?: string
          service_area_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_area_trust_factors_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          business_hours: string | null
          canonical_url: string | null
          created_at: string
          cta_heading: string | null
          cta_subtext: string | null
          display_order: number
          full_description: string
          hero_bg_image: string | null
          hero_subtitle: string | null
          id: string
          is_active: boolean
          is_home_office: boolean
          location_key: string
          location_name: string
          meta_description: string
          meta_keywords: string | null
          meta_title: string
          og_description: string | null
          og_image: string | null
          og_title: string | null
          phone_number: string | null
          primary_keyword: string | null
          regional_expertise_text: string | null
          secondary_keywords: string[] | null
          short_description: string
          specialized_knowledge_text: string | null
          title: string
          updated_at: string
        }
        Insert: {
          business_hours?: string | null
          canonical_url?: string | null
          created_at?: string
          cta_heading?: string | null
          cta_subtext?: string | null
          display_order?: number
          full_description: string
          hero_bg_image?: string | null
          hero_subtitle?: string | null
          id?: string
          is_active?: boolean
          is_home_office?: boolean
          location_key: string
          location_name: string
          meta_description: string
          meta_keywords?: string | null
          meta_title: string
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          phone_number?: string | null
          primary_keyword?: string | null
          regional_expertise_text?: string | null
          secondary_keywords?: string[] | null
          short_description: string
          specialized_knowledge_text?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          business_hours?: string | null
          canonical_url?: string | null
          created_at?: string
          cta_heading?: string | null
          cta_subtext?: string | null
          display_order?: number
          full_description?: string
          hero_bg_image?: string | null
          hero_subtitle?: string | null
          id?: string
          is_active?: boolean
          is_home_office?: boolean
          location_key?: string
          location_name?: string
          meta_description?: string
          meta_keywords?: string | null
          meta_title?: string
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          phone_number?: string | null
          primary_keyword?: string | null
          regional_expertise_text?: string | null
          secondary_keywords?: string[] | null
          short_description?: string
          specialized_knowledge_text?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_benefits: {
        Row: {
          created_at: string | null
          description: string
          display_order: number | null
          id: string
          service_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order?: number | null
          id?: string
          service_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number | null
          id?: string
          service_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_benefits_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_faqs: {
        Row: {
          answer: string
          created_at: string | null
          display_order: number | null
          id: string
          question: string
          service_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          question: string
          service_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          question?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_features: {
        Row: {
          created_at: string | null
          display_order: number | null
          feature_text: string
          id: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          feature_text: string
          id?: string
          service_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          feature_text?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_features_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          canonical_url: string | null
          category: string
          created_at: string | null
          display_order: number | null
          hero_bg_color: string | null
          hero_bg_image: string | null
          hero_bg_position: string | null
          hero_opacity: number | null
          icon_name: string
          id: string
          is_active: boolean | null
          long_description: string
          meta_description: string
          meta_keywords: string | null
          meta_title: string
          og_description: string | null
          og_image: string | null
          og_title: string | null
          primary_keyword: string | null
          secondary_keywords: string[] | null
          short_description: string
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          canonical_url?: string | null
          category: string
          created_at?: string | null
          display_order?: number | null
          hero_bg_color?: string | null
          hero_bg_image?: string | null
          hero_bg_position?: string | null
          hero_opacity?: number | null
          icon_name: string
          id?: string
          is_active?: boolean | null
          long_description: string
          meta_description: string
          meta_keywords?: string | null
          meta_title: string
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          primary_keyword?: string | null
          secondary_keywords?: string[] | null
          short_description: string
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          canonical_url?: string | null
          category?: string
          created_at?: string | null
          display_order?: number | null
          hero_bg_color?: string | null
          hero_bg_image?: string | null
          hero_bg_position?: string | null
          hero_opacity?: number | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          long_description?: string
          meta_description?: string
          meta_keywords?: string | null
          meta_title?: string
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          primary_keyword?: string | null
          secondary_keywords?: string[] | null
          short_description?: string
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      site_integrations: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          name: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          name: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          name?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      sitemap_urls: {
        Row: {
          change_frequency: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_checked: string | null
          priority: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          change_frequency?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_checked?: string | null
          priority?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          change_frequency?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_checked?: string | null
          priority?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      snapshot_images: {
        Row: {
          alt_text: string
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      training_employees: {
        Row: {
          created_at: string
          evaluation_type: string | null
          id: string
          name: string
          phone: string | null
          supervisor: string | null
        }
        Insert: {
          created_at?: string
          evaluation_type?: string | null
          id?: string
          name: string
          phone?: string | null
          supervisor?: string | null
        }
        Update: {
          created_at?: string
          evaluation_type?: string | null
          id?: string
          name?: string
          phone?: string | null
          supervisor?: string | null
        }
        Relationships: []
      }
      training_questions: {
        Row: {
          chapter_or_annex: string
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          is_active: boolean
          options: Json
          question: string
          question_type: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          chapter_or_annex: string
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          options?: Json
          question: string
          question_type: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          chapter_or_annex?: string
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          options?: Json
          question?: string
          question_type?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      training_quiz_answers: {
        Row: {
          attempt_id: string
          correct_answer: string | null
          created_at: string
          id: string
          is_correct: boolean
          question_id: string | null
          question_snapshot: Json
          selected_answer: string | null
        }
        Insert: {
          attempt_id: string
          correct_answer?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string | null
          question_snapshot?: Json
          selected_answer?: string | null
        }
        Update: {
          attempt_id?: string
          correct_answer?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string | null
          question_snapshot?: Json
          selected_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "training_quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "training_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_quiz_attempts: {
        Row: {
          chapter_or_annex: string | null
          completed_at: string
          correct_answers: number
          employee_id: string
          id: string
          passed: boolean
          quiz_type: string
          score: number
          total_questions: number
        }
        Insert: {
          chapter_or_annex?: string | null
          completed_at?: string
          correct_answers?: number
          employee_id: string
          id?: string
          passed?: boolean
          quiz_type: string
          score?: number
          total_questions?: number
        }
        Update: {
          chapter_or_annex?: string | null
          completed_at?: string
          correct_answers?: number
          employee_id?: string
          id?: string
          passed?: boolean
          quiz_type?: string
          score?: number
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_quiz_attempts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "training_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_inspections: {
        Row: {
          corrective_actions: string | null
          created_at: string
          id: string
          inspected_by: string | null
          inspection_date: string
          inspection_type: string
          issues_found: string[] | null
          mileage: number
          next_inspection_due: string | null
          notes: string | null
          passed: boolean
          vehicle_id: string
        }
        Insert: {
          corrective_actions?: string | null
          created_at?: string
          id?: string
          inspected_by?: string | null
          inspection_date: string
          inspection_type: string
          issues_found?: string[] | null
          mileage: number
          next_inspection_due?: string | null
          notes?: string | null
          passed: boolean
          vehicle_id: string
        }
        Update: {
          corrective_actions?: string | null
          created_at?: string
          id?: string
          inspected_by?: string | null
          inspection_date?: string
          inspection_type?: string
          issues_found?: string[] | null
          mileage?: number
          next_inspection_due?: string | null
          notes?: string | null
          passed?: boolean
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspections_inspected_by_fkey"
            columns: ["inspected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance: {
        Row: {
          cost: number | null
          created_at: string
          description: string | null
          id: string
          invoice_number: string | null
          maintenance_type: string
          mileage_at_service: number
          next_service_due_date: string | null
          next_service_due_mileage: number | null
          notes: string | null
          parts_replaced: string[] | null
          performed_by: string | null
          service_date: string
          vehicle_id: string
          vendor: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_number?: string | null
          maintenance_type: string
          mileage_at_service: number
          next_service_due_date?: string | null
          next_service_due_mileage?: number | null
          notes?: string | null
          parts_replaced?: string[] | null
          performed_by?: string | null
          service_date: string
          vehicle_id: string
          vendor?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_number?: string | null
          maintenance_type?: string
          mileage_at_service?: number
          next_service_due_date?: string | null
          next_service_due_mileage?: number | null
          notes?: string | null
          parts_replaced?: string[] | null
          performed_by?: string | null
          service_date?: string
          vehicle_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          assigned_to: string | null
          created_at: string
          current_mileage: number
          dot_inspection_due: string | null
          fuel_type: string
          id: string
          insurance_expiry: string | null
          insurance_policy_number: string | null
          license_plate: string
          make: string
          model: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          registration_expiry: string | null
          status: string
          truck_size: string | null
          updated_at: string
          vehicle_number: string
          vehicle_type: string
          vin: string
          year: number
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          current_mileage?: number
          dot_inspection_due?: string | null
          fuel_type: string
          id?: string
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          license_plate: string
          make: string
          model: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          registration_expiry?: string | null
          status?: string
          truck_size?: string | null
          updated_at?: string
          vehicle_number: string
          vehicle_type: string
          vin: string
          year: number
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          current_mileage?: number
          dot_inspection_due?: string | null
          fuel_type?: string
          id?: string
          insurance_expiry?: string | null
          insurance_policy_number?: string | null
          license_plate?: string
          make?: string
          model?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          registration_expiry?: string | null
          status?: string
          truck_size?: string | null
          updated_at?: string
          vehicle_number?: string
          vehicle_type?: string
          vin?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_job_number: { Args: never; Returns: string }
      get_training_attempt: { Args: { _attempt_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      send_quote_follow_ups: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "staff" | "client"
      document_type:
        | "bill_of_sale"
        | "estimate"
        | "contract"
        | "invoice"
        | "receipt"
        | "other"
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
      app_role: ["admin", "staff", "client"],
      document_type: [
        "bill_of_sale",
        "estimate",
        "contract",
        "invoice",
        "receipt",
        "other",
      ],
    },
  },
} as const
