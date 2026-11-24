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
  public: {
    Tables: {
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          bio: string | null
          country_code: string | null
          created_at: string
          display_name: string
          id: string
          preferred_language: string
          updated_at: string
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string
          id: string
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string
          id?: string
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: { user_id: string; event_type: string; in_app_enabled: boolean; email_enabled: boolean; push_enabled: boolean; updated_at: string }
        Insert: { user_id: string; event_type: string; in_app_enabled?: boolean; email_enabled?: boolean; push_enabled?: boolean; updated_at?: string }
        Update: { user_id?: string; event_type?: string; in_app_enabled?: boolean; email_enabled?: boolean; push_enabled?: boolean; updated_at?: string }
        Relationships: [{ foreignKeyName: "notification_preferences_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      notifications: {
        Row: { id: string; user_id: string; actor_id: string | null; project_id: string | null; request_id: string | null; type: string; title: string; body: string; href: string; read_at: string | null; created_at: string }
        Insert: { id?: string; user_id: string; actor_id?: string | null; project_id?: string | null; request_id?: string | null; type: string; title: string; body?: string; href: string; read_at?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; actor_id?: string | null; project_id?: string | null; request_id?: string | null; type?: string; title?: string; body?: string; href?: string; read_at?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "notifications_actor_id_fkey"; columns: ["actor_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "notifications_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "notifications_request_id_fkey"; columns: ["request_id"]; isOneToOne: false; referencedRelation: "requests"; referencedColumns: ["id"] }
        ]
      }
      project_members: {
        Row: {
          added_by: string
          created_at: string
          member_role: string
          project_id: string
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          member_role?: string
          project_id: string
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          member_role?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_amount_minor: number | null
          created_at: string
          created_by: string
          currency: string | null
          description: string
          due_at: string | null
          id: string
          request_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_amount_minor?: number | null
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string
          due_at?: string | null
          id?: string
          request_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_amount_minor?: number | null
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string
          due_at?: string | null
          id?: string
          request_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_profiles: {
        Row: {
          accepting_work: boolean
          created_at: string
          description: string | null
          headline: string | null
          provider_kind: string
          service_area_label: string | null
          service_categories: string[]
          service_radius_km: number | null
          updated_at: string
          user_id: string
          verification_status: string
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          accepting_work?: boolean
          created_at?: string
          description?: string | null
          headline?: string | null
          provider_kind?: string
          service_area_label?: string | null
          service_categories?: string[]
          service_radius_km?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          accepting_work?: boolean
          created_at?: string
          description?: string | null
          headline?: string | null
          provider_kind?: string
          service_area_label?: string | null
          service_categories?: string[]
          service_radius_km?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_schedules: {
        Row: { id: string; project_id: string; provider_user_id: string; requested_by: string; starts_at: string; ends_at: string; status: string; created_at: string; updated_at: string }
        Insert: { id?: string; project_id: string; provider_user_id: string; requested_by: string; starts_at: string; ends_at: string; status?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; project_id?: string; provider_user_id?: string; requested_by?: string; starts_at?: string; ends_at?: string; status?: string; created_at?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: "project_schedules_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "project_schedules_provider_user_id_fkey"; columns: ["provider_user_id"]; isOneToOne: false; referencedRelation: "provider_profiles"; referencedColumns: ["user_id"] }
        ]
      }
      provider_availability: {
        Row: { id: string; user_id: string; day_of_week: number; start_time: string; end_time: string; timezone: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; day_of_week: number; start_time: string; end_time: string; timezone?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; day_of_week?: number; start_time?: string; end_time?: string; timezone?: string; created_at?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "provider_availability_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "provider_profiles"; referencedColumns: ["user_id"] }]
      }
      requests: {
        Row: {
          budget_amount_minor: number | null
          category: string | null
          created_at: string
          created_by: string
          currency: string | null
          description: string
          desired_at: string | null
          id: string
          location_label: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_amount_minor?: number | null
          category?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string
          desired_at?: string | null
          id?: string
          location_label?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_amount_minor?: number | null
          category?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string
          desired_at?: string | null
          id?: string
          location_label?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      request_execution_plans: {
        Row: {
          id: string
          request_id: string
          created_by: string
          title: string
          summary: string
          source: string
          status: string
          steps: Json
          provider_needs: Json
          risks: Json
          budget_guidance: string
          timeline_guidance: string
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_id: string
          created_by: string
          title: string
          summary?: string
          source?: string
          status?: string
          steps?: Json
          provider_needs?: Json
          risks?: Json
          budget_guidance?: string
          timeline_guidance?: string
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          created_by?: string
          title?: string
          summary?: string
          source?: string
          status?: string
          steps?: Json
          provider_needs?: Json
          risks?: Json
          budget_guidance?: string
          timeline_guidance?: string
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "request_execution_plans_request_id_fkey"; columns: ["request_id"]; isOneToOne: true; referencedRelation: "requests"; referencedColumns: ["id"] }
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          blocked_reason: string | null
          completed_at: string | null
          completion_note: string | null
          completion_submitted_at: string | null
          created_at: string
          created_by: string
          description: string
          due_at: string | null
          id: string
          project_id: string
          reviewed_at: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          completion_note?: string | null
          completion_submitted_at?: string | null
          created_at?: string
          created_by: string
          description?: string
          due_at?: string | null
          id?: string
          project_id: string
          reviewed_at?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          completion_note?: string | null
          completion_submitted_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_at?: string | null
          id?: string
          project_id?: string
          reviewed_at?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      request_plans: {
        Row: { id: string; project_id: string; created_by: string; title: string; summary: string; source: string; status: string; steps: Json; approved_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; project_id: string; created_by: string; title: string; summary?: string; source?: string; status?: string; steps: Json; approved_at?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; project_id?: string; created_by?: string; title?: string; summary?: string; source?: string; status?: string; steps?: Json; approved_at?: string | null; created_at?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "request_plans_project_id_fkey"; columns: ["project_id"]; isOneToOne: true; referencedRelation: "projects"; referencedColumns: ["id"] }]
      }
      request_publications: {
        Row: { request_id: string; title: string; description: string; category: string | null; budget_amount_minor: number | null; currency: string | null; desired_at: string | null; published_at: string }
        Insert: { request_id: string; title: string; description: string; category?: string | null; budget_amount_minor?: number | null; currency?: string | null; desired_at?: string | null; published_at?: string }
        Update: { request_id?: string; title?: string; description?: string; category?: string | null; budget_amount_minor?: number | null; currency?: string | null; desired_at?: string | null; published_at?: string }
        Relationships: [{ foreignKeyName: "request_publications_request_id_fkey"; columns: ["request_id"]; isOneToOne: true; referencedRelation: "requests"; referencedColumns: ["id"] }]
      }
      proposals: {
        Row: { id: string; request_id: string; provider_user_id: string; amount_minor: number; currency: string; message: string; estimated_duration: string | null; status: string; created_at: string; updated_at: string }
        Insert: { id?: string; request_id: string; provider_user_id: string; amount_minor: number; currency: string; message: string; estimated_duration?: string | null; status?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; request_id?: string; provider_user_id?: string; amount_minor?: number; currency?: string; message?: string; estimated_duration?: string | null; status?: string; created_at?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: "proposals_request_id_fkey"; columns: ["request_id"]; isOneToOne: false; referencedRelation: "requests"; referencedColumns: ["id"] },
          { foreignKeyName: "proposals_provider_user_id_fkey"; columns: ["provider_user_id"]; isOneToOne: false; referencedRelation: "provider_profiles"; referencedColumns: ["user_id"] }
        ]
      }
      project_milestones: {
        Row: { id: string; project_id: string; title: string; description: string; due_at: string | null; status: string; completed_at: string | null; sort_order: number; created_by: string; created_at: string; updated_at: string }
        Insert: { id?: string; project_id: string; title: string; description?: string; due_at?: string | null; status?: string; completed_at?: string | null; sort_order?: number; created_by: string; created_at?: string; updated_at?: string }
        Update: { id?: string; project_id?: string; title?: string; description?: string; due_at?: string | null; status?: string; completed_at?: string | null; sort_order?: number; created_by?: string; created_at?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "project_milestones_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] }]
      }
      project_messages: {
        Row: { id: string; project_id: string; sender_id: string; body: string; message_type: string; created_at: string }
        Insert: { id?: string; project_id: string; sender_id: string; body: string; message_type?: string; created_at?: string }
        Update: { id?: string; project_id?: string; sender_id?: string; body?: string; message_type?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "project_messages_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "project_messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      project_attachments: {
        Row: { id: string; project_id: string; task_id: string | null; uploaded_by: string; file_name: string; object_path: string; mime_type: string; file_size: number; created_at: string }
        Insert: { id?: string; project_id: string; task_id?: string | null; uploaded_by: string; file_name: string; object_path: string; mime_type: string; file_size: number; created_at?: string }
        Update: { id?: string; project_id?: string; task_id?: string | null; uploaded_by?: string; file_name?: string; object_path?: string; mime_type?: string; file_size?: number; created_at?: string }
        Relationships: [
          { foreignKeyName: "project_attachments_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
          { foreignKeyName: "project_attachments_task_id_fkey"; columns: ["task_id"]; isOneToOne: false; referencedRelation: "tasks"; referencedColumns: ["id"] },
          { foreignKeyName: "project_attachments_uploaded_by_fkey"; columns: ["uploaded_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ]
      }
      service_listings: {
        Row: { category: string; created_at: string; currency: string; description: string; id: string; is_active: boolean; price_amount_minor: number | null; pricing_model: string; provider_user_id: string; title: string; updated_at: string }
        Insert: { category: string; created_at?: string; currency?: string; description: string; id?: string; is_active?: boolean; price_amount_minor?: number | null; pricing_model?: string; provider_user_id: string; title: string; updated_at?: string }
        Update: { category?: string; created_at?: string; currency?: string; description?: string; id?: string; is_active?: boolean; price_amount_minor?: number | null; pricing_model?: string; provider_user_id?: string; title?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "service_listings_provider_user_id_fkey"; columns: ["provider_user_id"]; isOneToOne: false; referencedRelation: "provider_profiles"; referencedColumns: ["user_id"] }]
      }
      trust_verifications: {
        Row: {
          check_type: string
          created_at: string
          expires_at: string | null
          id: string
          provider_reference: string | null
          reviewed_at: string | null
          reviewer_note_private: string | null
          status: string
          user_id: string
        }
        Insert: {
          check_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider_reference?: string | null
          reviewed_at?: string | null
          reviewer_note_private?: string | null
          status?: string
          user_id: string
        }
        Update: {
          check_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider_reference?: string | null
          reviewed_at?: string | null
          reviewer_note_private?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_verifications_user_id_fkey"
            columns: ["user_id"]
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
    save_provider_availability: { Args: { p_timezone: string; p_windows: Json }; Returns: undefined };

      request_project_schedule: { Args: { p_project_id: string; p_starts_at: string; p_ends_at: string }; Returns: string }
      confirm_project_schedule: { Args: { p_schedule_id: string }; Returns: undefined }
      decline_project_schedule: { Args: { p_schedule_id: string }; Returns: undefined }
      cancel_project_schedule: { Args: { p_schedule_id: string }; Returns: undefined }
      accept_proposal: { Args: { p_proposal_id: string }; Returns: string }
      approve_request_plan: { Args: { p_plan_id: string }; Returns: string }
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
  public: {
    Enums: {},
  },
} as const
