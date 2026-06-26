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
      incident_reports: {
        Row: {
          action_taken: string | null
          created_at: string
          damage_description: string | null
          description: string
          equipment_ownership: string
          id: string
          incident_date: string
          incident_time: string | null
          injuries: boolean
          injury_description: string | null
          location: string | null
          people_involved: string | null
          property_damage: boolean
          report_type: string
          reported_by: string | null
          status: string
          updated_at: string
          vehicle: string | null
          witnesses: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          damage_description?: string | null
          description: string
          equipment_ownership?: string
          id?: string
          incident_date?: string
          incident_time?: string | null
          injuries?: boolean
          injury_description?: string | null
          location?: string | null
          people_involved?: string | null
          property_damage?: boolean
          report_type?: string
          reported_by?: string | null
          status?: string
          updated_at?: string
          vehicle?: string | null
          witnesses?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          damage_description?: string | null
          description?: string
          equipment_ownership?: string
          id?: string
          incident_date?: string
          incident_time?: string | null
          injuries?: boolean
          injury_description?: string | null
          location?: string | null
          people_involved?: string | null
          property_damage?: boolean
          report_type?: string
          reported_by?: string | null
          status?: string
          updated_at?: string
          vehicle?: string | null
          witnesses?: string | null
        }
        Relationships: []
      }
      bid_logs: {
        Row: {
          bid_amount: number | null
          bid_date: string | null
          bid_number: string
          contractor: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bid_amount?: number | null
          bid_date?: string | null
          bid_number: string
          contractor?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bid_amount?: number | null
          bid_date?: string | null
          bid_number?: string
          contractor?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      po_logs: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          delivery_date: string | null
          description: string | null
          id: string
          notes: string | null
          po_date: string | null
          po_number: string
          project_id: string
          status: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          delivery_date?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          po_date?: string | null
          po_number: string
          project_id: string
          status?: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          delivery_date?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          po_date?: string | null
          po_number?: string
          project_id?: string
          status?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          content_type: string | null
          created_at: string
          extracted_text: string | null
          extraction_status: string
          file_path: string
          file_size: number | null
          id: string
          name: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          extracted_text?: string | null
          extraction_status?: string
          file_path: string
          file_size?: number | null
          id?: string
          name: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          extracted_text?: string | null
          extraction_status?: string
          file_path?: string
          file_size?: number | null
          id?: string
          name?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_items: {
        Row: {
          committed: boolean
          created_at: string
          created_by: string | null
          expected_delivery: string | null
          id: string
          item: string
          notes: string | null
          po_number: string | null
          project_id: string
          purchased: boolean
          sort_order: number
          status: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          committed?: boolean
          created_at?: string
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          item: string
          notes?: string | null
          po_number?: string | null
          project_id: string
          purchased?: boolean
          sort_order?: number
          status?: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          committed?: boolean
          created_at?: string
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          item?: string
          notes?: string | null
          po_number?: string | null
          project_id?: string
          purchased?: boolean
          sort_order?: number
          status?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procurement_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          actual: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          project_id: string
          scheduled: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          actual?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          project_id: string
          scheduled?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          actual?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          project_id?: string
          scheduled?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_to: string | null
          bid_due_date: string | null
          client: string | null
          contract_completion: string | null
          created_at: string
          created_by: string | null
          current_completion: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          value: number
        }
        Insert: {
          assigned_to?: string | null
          bid_due_date?: string | null
          client?: string | null
          contract_completion?: string | null
          created_at?: string
          created_by?: string | null
          current_completion?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          value?: number
        }
        Update: {
          assigned_to?: string | null
          bid_due_date?: string | null
          client?: string | null
          contract_completion?: string | null
          created_at?: string
          created_by?: string | null
          current_completion?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      vehicle_inspections: {
        Row: {
          blinkers_ok: boolean
          brake_lights_ok: boolean
          clearance_lights_ok: boolean
          controls_ok: boolean
          created_at: string
          defects: string | null
          fluids_ok: boolean
          guards_ok: boolean
          headlights_ok: boolean
          id: string
          inspected_by: string | null
          inspection_date: string
          inspector_name: string | null
          odometer: number | null
          running_lights_ok: boolean
          status: string
          tires_ok: boolean
          updated_at: string
          vehicle: string
        }
        Insert: {
          blinkers_ok?: boolean
          brake_lights_ok?: boolean
          clearance_lights_ok?: boolean
          controls_ok?: boolean
          created_at?: string
          defects?: string | null
          fluids_ok?: boolean
          guards_ok?: boolean
          headlights_ok?: boolean
          id?: string
          inspected_by?: string | null
          inspection_date?: string
          inspector_name?: string | null
          odometer?: number | null
          running_lights_ok?: boolean
          status?: string
          tires_ok?: boolean
          updated_at?: string
          vehicle: string
        }
        Update: {
          blinkers_ok?: boolean
          brake_lights_ok?: boolean
          clearance_lights_ok?: boolean
          controls_ok?: boolean
          created_at?: string
          defects?: string | null
          fluids_ok?: boolean
          guards_ok?: boolean
          headlights_ok?: boolean
          id?: string
          inspected_by?: string | null
          inspection_date?: string
          inspector_name?: string | null
          odometer?: number | null
          running_lights_ok?: boolean
          status?: string
          tires_ok?: boolean
          updated_at?: string
          vehicle?: string
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
      purchasing_logs: {
        Row: {
          contract_amount: number | null
          contract_issued: string | null
          contractor: string | null
          cost_code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          material_amount: number | null
          noci: number | null
          notes: string | null
          original_budget: number | null
          po_number: string | null
          project_id: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          contract_amount?: number | null
          contract_issued?: string | null
          contractor?: string | null
          cost_code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          material_amount?: number | null
          noci?: number | null
          notes?: string | null
          original_budget?: number | null
          po_number?: string | null
          project_id: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          contract_amount?: number | null
          contract_issued?: string | null
          contractor?: string | null
          cost_code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          material_amount?: number | null
          noci?: number | null
          notes?: string | null
          original_budget?: number | null
          po_number?: string | null
          project_id?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchasing_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rfi_logs: {
        Row: {
          closed: boolean
          cost_impact: number | null
          created_at: string
          created_by: string | null
          date_received: string | null
          date_required: string | null
          description: string
          id: string
          issue_date: string | null
          notes: string | null
          project_id: string
          rfi_number: string
          updated_at: string
        }
        Insert: {
          closed?: boolean
          cost_impact?: number | null
          created_at?: string
          created_by?: string | null
          date_received?: string | null
          date_required?: string | null
          description: string
          id?: string
          issue_date?: string | null
          notes?: string | null
          project_id: string
          rfi_number: string
          updated_at?: string
        }
        Update: {
          closed?: boolean
          cost_impact?: number | null
          created_at?: string
          created_by?: string | null
          date_received?: string | null
          date_required?: string | null
          description?: string
          id?: string
          issue_date?: string | null
          notes?: string | null
          project_id?: string
          rfi_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfi_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_delays: {
        Row: {
          created_at: string
          created_by: string | null
          days_delayed: number | null
          delay_description: string
          id: string
          impact: string | null
          notes: string | null
          original_date: string | null
          project_id: string
          reason: string | null
          revised_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          days_delayed?: number | null
          delay_description: string
          id?: string
          impact?: string | null
          notes?: string | null
          original_date?: string | null
          project_id: string
          reason?: string | null
          revised_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          days_delayed?: number | null
          delay_description?: string
          id?: string
          impact?: string | null
          notes?: string | null
          original_date?: string | null
          project_id?: string
          reason?: string | null
          revised_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_delays_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_logs: {
        Row: {
          closed: boolean
          created_at: string
          created_by: string | null
          date_received: string | null
          date_required: string | null
          description: string
          id: string
          issue_date: string | null
          notes: string | null
          project_id: string
          submittal_number: string
          updated_at: string
        }
        Insert: {
          closed?: boolean
          created_at?: string
          created_by?: string | null
          date_received?: string | null
          date_required?: string | null
          description: string
          id?: string
          issue_date?: string | null
          notes?: string | null
          project_id: string
          submittal_number: string
          updated_at?: string
        }
        Update: {
          closed?: boolean
          created_at?: string
          created_by?: string | null
          date_received?: string | null
          date_required?: string | null
          description?: string
          id?: string
          issue_date?: string | null
          notes?: string | null
          project_id?: string
          submittal_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submittal_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "executive" | "project_manager" | "viewer"
      project_status:
        | "bid_pre_contract"
        | "bid_under_contract"
        | "active"
        | "complete"
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
      app_role: ["admin", "executive", "project_manager", "viewer"],
      project_status: [
        "bid_pre_contract",
        "bid_under_contract",
        "active",
        "complete",
      ],
    },
  },
} as const
