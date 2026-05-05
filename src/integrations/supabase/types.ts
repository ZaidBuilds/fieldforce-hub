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
      business_settings: {
        Row: {
          address: string | null
          business_name: string
          city: string | null
          created_at: string
          default_gst_rate: number
          email: string | null
          gst_number: string | null
          id: string
          invoice_prefix: string
          logo_url: string | null
          next_invoice_number: number
          owner_id: string
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string
          city?: string | null
          created_at?: string
          default_gst_rate?: number
          email?: string | null
          gst_number?: string | null
          id?: string
          invoice_prefix?: string
          logo_url?: string | null
          next_invoice_number?: number
          owner_id: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string | null
          created_at?: string
          default_gst_rate?: number
          email?: string | null
          gst_number?: string | null
          id?: string
          invoice_prefix?: string
          logo_url?: string | null
          next_invoice_number?: number
          owner_id?: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          gst_number: string | null
          id: string
          name: string
          phone: string
          pincode: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          name: string
          phone: string
          pincode?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          name?: string
          phone?: string
          pincode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          job_id: string | null
          spent_on: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          spent_on?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          spent_on?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          created_at: string
          id: string
          low_stock_threshold: number
          name: string
          sku: string | null
          stock: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          low_stock_threshold?: number
          name: string
          sku?: string | null
          stock?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          low_stock_threshold?: number
          name?: string
          sku?: string | null
          stock?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          gst_amount: number
          gst_rate: number
          id: string
          invoice_number: string
          is_paid: boolean
          job_id: string
          notes: string | null
          paid_at: string | null
          payment_link_created_at: string | null
          payment_link_status: string
          pdf_url: string | null
          razorpay_payment_id: string | null
          razorpay_payment_link_id: string | null
          razorpay_payment_link_url: string | null
          subtotal: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          gst_amount: number
          gst_rate?: number
          id?: string
          invoice_number: string
          is_paid?: boolean
          job_id: string
          notes?: string | null
          paid_at?: string | null
          payment_link_created_at?: string | null
          payment_link_status?: string
          pdf_url?: string | null
          razorpay_payment_id?: string | null
          razorpay_payment_link_id?: string | null
          razorpay_payment_link_url?: string | null
          subtotal: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          gst_amount?: number
          gst_rate?: number
          id?: string
          invoice_number?: string
          is_paid?: boolean
          job_id?: string
          notes?: string | null
          paid_at?: string | null
          payment_link_created_at?: string | null
          payment_link_status?: string
          pdf_url?: string | null
          razorpay_payment_id?: string | null
          razorpay_payment_link_id?: string | null
          razorpay_payment_link_url?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_parts: {
        Row: {
          created_at: string
          id: string
          job_id: string
          name: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          name: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          name?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: []
      }
      job_photos: {
        Row: {
          captured_at: string
          created_at: string
          id: string
          job_id: string
          photo_type: string
          photo_url: string
          uploaded_by: string | null
        }
        Insert: {
          captured_at?: string
          created_at?: string
          id?: string
          job_id: string
          photo_type: string
          photo_url: string
          uploaded_by?: string | null
        }
        Update: {
          captured_at?: string
          created_at?: string
          id?: string
          job_id?: string
          photo_type?: string
          photo_url?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string | null
          assigned_to: string | null
          checkin_at: string | null
          checkin_latitude: number | null
          checkin_longitude: number | null
          checkout_at: string | null
          city: string | null
          created_at: string
          created_by: string | null
          customer_feedback: string | null
          customer_id: string
          customer_rating: number | null
          customer_signature_url: string | null
          description: string | null
          eta_minutes: number | null
          feedback_token: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          payment_amount: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pincode: string | null
          priority: number
          scheduled_date: string | null
          scheduled_time_end: string | null
          scheduled_time_start: string | null
          service_type: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          tracking_token: string | null
          updated_at: string
          whatsapp_sent_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          checkin_at?: string | null
          checkin_latitude?: number | null
          checkin_longitude?: number | null
          checkout_at?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          customer_feedback?: string | null
          customer_id: string
          customer_rating?: number | null
          customer_signature_url?: string | null
          description?: string | null
          eta_minutes?: number | null
          feedback_token?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          payment_amount?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pincode?: string | null
          priority?: number
          scheduled_date?: string | null
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          tracking_token?: string | null
          updated_at?: string
          whatsapp_sent_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          checkin_at?: string | null
          checkin_latitude?: number | null
          checkin_longitude?: number | null
          checkout_at?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          customer_feedback?: string | null
          customer_id?: string
          customer_rating?: number | null
          customer_signature_url?: string | null
          description?: string | null
          eta_minutes?: number | null
          feedback_token?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          payment_amount?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pincode?: string | null
          priority?: number
          scheduled_date?: string | null
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          tracking_token?: string | null
          updated_at?: string
          whatsapp_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          phone: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_contracts: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          frequency_days: number
          id: string
          next_due_date: string
          notes: string | null
          service_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          frequency_days?: number
          id?: string
          next_due_date: string
          notes?: string | null
          service_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          frequency_days?: number
          id?: string
          next_due_date?: string
          notes?: string | null
          service_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "manager" | "technician"
      job_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
      payment_method: "cash" | "upi" | "online"
      payment_status: "pending" | "collected" | "verified"
      user_role: "owner" | "technician"
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
      app_role: ["owner", "manager", "technician"],
      job_status: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      payment_method: ["cash", "upi", "online"],
      payment_status: ["pending", "collected", "verified"],
      user_role: ["owner", "technician"],
    },
  },
} as const
