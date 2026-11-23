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
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string
          due_at: string | null
          id: string
          project_id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string
          due_at?: string | null
          id?: string
          project_id: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_at?: string | null
          id?: string
          project_id?: string
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
