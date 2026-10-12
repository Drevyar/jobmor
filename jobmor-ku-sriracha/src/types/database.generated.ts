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
      applications: {
        Row: {
          applicant_id: string
          created_at: string
          id: string
          job_id: string
          message: string
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          id?: string
          job_id: string
          message?: string
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          id?: string
          job_id?: string
          message?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      business_categories: {
        Row: {
          created_at: string
          id: number
          name_en: string
          name_th: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: number
          name_en: string
          name_th: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: number
          name_en?: string
          name_th?: string
          slug?: string
        }
        Relationships: []
      }
      employer_profiles: {
        Row: {
          address: string
          business_category: string
          company_name: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          address: string
          business_category: string
          company_name: string
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          address?: string
          business_category?: string
          company_name?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_radar_recommendations: {
        Row: {
          created_at: string
          job_id: string
          reasons: Json
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          job_id: string
          reasons: Json
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          job_id?: string
          reasons?: Json
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_radar_recommendations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_radar_recommendations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          category: string
          contact_information: string
          created_at: string
          description: string
          employer_id: string
          id: string
          instant_accept: boolean
          is_urgent: boolean
          latitude: number | null
          location: string
          longitude: number | null
          requirements: string
          shift: string
          status: string
          title: string
          updated_at: string
          urgent_radius_km: number
          wage: number
          wage_type: string
          workers_required: number
          working_date: string
        }
        Insert: {
          category: string
          contact_information: string
          created_at?: string
          description: string
          employer_id: string
          id?: string
          instant_accept?: boolean
          is_urgent?: boolean
          latitude?: number | null
          location: string
          longitude?: number | null
          requirements?: string
          shift: string
          status?: string
          title: string
          updated_at?: string
          urgent_radius_km?: number
          wage: number
          wage_type: string
          workers_required: number
          working_date: string
        }
        Update: {
          category?: string
          contact_information?: string
          created_at?: string
          description?: string
          employer_id?: string
          id?: string
          instant_accept?: boolean
          is_urgent?: boolean
          latitude?: number | null
          location?: string
          longitude?: number | null
          requirements?: string
          shift?: string
          status?: string
          title?: string
          updated_at?: string
          urgent_radius_km?: number
          wage?: number
          wage_type?: string
          workers_required?: number
          working_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          work_experience: string
          work_skills: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          work_experience?: string
          work_skills?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          phone?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          work_experience?: string
          work_skills?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          created_at: string
          job_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          job_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          job_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_availability: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          starts_at: string
          student_id: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          starts_at: string
          student_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          starts_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_availability_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_job_interactions: {
        Row: {
          created_at: string
          interaction_type: string
          job_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          interaction_type: string
          job_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          interaction_type?: string
          job_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_job_interactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_job_interactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_job_locations: {
        Row: {
          latitude: number
          longitude: number
          radius_km: number
          student_id: string
          travel_mode: string
          updated_at: string
          urgent_enabled: boolean
        }
        Insert: {
          latitude: number
          longitude: number
          radius_km?: number
          student_id: string
          travel_mode?: string
          updated_at?: string
          urgent_enabled?: boolean
        }
        Update: {
          latitude?: number
          longitude?: number
          radius_km?: number
          student_id?: string
          travel_mode?: string
          updated_at?: string
          urgent_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "student_job_locations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_job_preferences: {
        Row: {
          minimum_wage: number
          preferred_area: string
          preferred_category: string
          student_id: string
          updated_at: string
          wage_type: string
        }
        Insert: {
          minimum_wage?: number
          preferred_area?: string
          preferred_category?: string
          student_id: string
          updated_at?: string
          wage_type?: string
        }
        Update: {
          minimum_wage?: number
          preferred_area?: string
          preferred_category?: string
          student_id?: string
          updated_at?: string
          wage_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_job_preferences_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_push_devices: {
        Row: {
          created_at: string
          id: string
          student_id: string
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          student_id: string
          token: string
        }
        Update: {
          created_at?: string
          id?: string
          student_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_push_devices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      urgent_job_notifications: {
        Row: {
          created_at: string
          id: string
          job_id: string
          read_at: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          read_at?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          read_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "urgent_job_notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "urgent_job_notifications_student_id_fkey"
            columns: ["student_id"]
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
      accept_urgent_job: {
        Args: { target_job: string }
        Returns: {
          applicant_id: string
          created_at: string
          id: string
          job_id: string
          message: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_user_suspended: {
        Args: { should_suspend: boolean; target_profile: string }
        Returns: undefined
      }
      admin_update_report: {
        Args: { new_status: string; target_report: string }
        Returns: undefined
      }
      claim_urgent_push: {
        Args: { target_job?: string }
        Returns: {
          delivery_id: string
          job_id: string
          title: string
          token: string
        }[]
      }
      consume_employer_ai_budget: {
        Args: { target_employer: string }
        Returns: boolean
      }
      consume_student_ai_budget: {
        Args: { target_student: string }
        Returns: boolean
      }
      finish_urgent_push: {
        Args: {
          code?: string
          delivery: string
          next_status: string
          ticket?: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      register_urgent_device: {
        Args: { push_token: string }
        Returns: undefined
      }
      update_employer_profile: {
        Args: {
          category: string
          company: string
          company_address: string
          contact_name: string
          contact_phone: string
        }
        Returns: undefined
      }
      urgent_push_receipts: {
        Args: never
        Returns: {
          delivery_id: string
          ticket_id: string
        }[]
      }
      urgent_worker_authorized: {
        Args: { worker_token: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "employer" | "admin"
      verification_status: "pending_email" | "verified" | "suspended"
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
    Enums: {
      app_role: ["student", "employer", "admin"],
      verification_status: ["pending_email", "verified", "suspended"],
    },
  },
} as const

