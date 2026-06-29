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
      bid_logs: {
        Row: {
          bid_amount: number | null
          bid_date: string | null
          bid_number: string | null
          contractor: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          project_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          bid_amount?: number | null
          bid_date?: string | null
          bid_number?: string | null
          contractor?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          project_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          bid_amount?: number | null
          bid_date?: string | null
          bid_number?: string | null
          contractor?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          status?: string | null
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
      certifications: {
        Row: {
          certificate_number: string | null
          certification: string
          created_at: string
          created_by: string | null
          employee_name: string
          expires_date: string | null
          id: string
          issued_date: string | null
          issuing_organization: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          certificate_number?: string | null
          certification: string
          created_at?: string
          created_by?: string | null
          employee_name: string
          expires_date?: string | null
          id?: string
          issued_date?: string | null
          issuing_organization?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          certificate_number?: string | null
          certification?: string
          created_at?: string
          created_by?: string | null
          employee_name?: string
          expires_date?: string | null
          id?: string
          issued_date?: string | null
          issuing_organization?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      driver_qualifications: {
        Row: {
          created_at: string
          created_by: string | null
          driver_name: string
          endorsements: string | null
          id: string
          last_mvr_review: string | null
          license_class: string | null
          license_expires: string | null
          license_number: string | null
          medical_card_expires: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          driver_name: string
          endorsements?: string | null
          id?: string
          last_mvr_review?: string | null
          license_class?: string | null
          license_expires?: string | null
          license_number?: string | null
          medical_card_expires?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          driver_name?: string
          endorsements?: string | null
          id?: string
          last_mvr_review?: string | null
          license_class?: string | null
          license_expires?: string | null
          license_number?: string | null
          medical_card_expires?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      handbook_acknowledgments: {
        Row: {
          acknowledged_date: string | null
          created_at: string
          created_by: string | null
          employee_name: string
          form_type: string
          id: string
          notes: string | null
          signed_on_file: boolean
          supervisor: string | null
          updated_at: string
        }
        Insert: {
          acknowledged_date?: string | null
          created_at?: string
          created_by?: string | null
          employee_name: string
          form_type: string
          id?: string
          notes?: string | null
          signed_on_file?: boolean
          supervisor?: string | null
          updated_at?: string
        }
        Update: {
          acknowledged_date?: string | null
          created_at?: string
          created_by?: string | null
          employee_name?: string
          form_type?: string
          id?: string
          notes?: string | null
          signed_on_file?: boolean
          supervisor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hazardous_chemicals: {
        Row: {
          chemical_name: string
          container_labeling: string | null
          created_at: string
          created_by: string | null
          hazards: string | null
          id: string
          location: string | null
          manufacturer: string | null
          notes: string | null
          quantity: string | null
          sds_on_file: boolean
          sds_url: string | null
          updated_at: string
        }
        Insert: {
          chemical_name: string
          container_labeling?: string | null
          created_at?: string
          created_by?: string | null
          hazards?: string | null
          id?: string
          location?: string | null
          manufacturer?: string | null
          notes?: string | null
          quantity?: string | null
          sds_on_file?: boolean
          sds_url?: string | null
          updated_at?: string
        }
        Update: {
          chemical_name?: string
          container_labeling?: string | null
          created_at?: string
          created_by?: string | null
          hazards?: string | null
          id?: string
          location?: string | null
          manufacturer?: string | null
          notes?: string | null
          quantity?: string | null
          sds_on_file?: boolean
          sds_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          action_taken: string | null
          created_at: string
          created_by: string | null
          damage_description: string | null
          description: string
          equipment_ownership: string | null
          id: string
          incident_date: string | null
          incident_time: string | null
          injuries: boolean
          injury_description: string | null
          location: string | null
          people_involved: string | null
          property_damage: boolean
          report_type: string
          status: string | null
          updated_at: string
          vehicle: string | null
          witnesses: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          created_by?: string | null
          damage_description?: string | null
          description: string
          equipment_ownership?: string | null
          id?: string
          incident_date?: string | null
          incident_time?: string | null
          injuries?: boolean
          injury_description?: string | null
          location?: string | null
          people_involved?: string | null
          property_damage?: boolean
          report_type: string
          status?: string | null
          updated_at?: string
          vehicle?: string | null
          witnesses?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          created_by?: string | null
          damage_description?: string | null
          description?: string
          equipment_ownership?: string | null
          id?: string
          incident_date?: string | null
          incident_time?: string | null
          injuries?: boolean
          injury_description?: string | null
          location?: string | null
          people_involved?: string | null
          property_damage?: boolean
          report_type?: string
          status?: string | null
          updated_at?: string
          vehicle?: string | null
          witnesses?: string | null
        }
        Relationships: []
      }
      job_safety_analyses: {
        Row: {
          controls: string | null
          created_at: string
          created_by: string | null
          hazards: string | null
          id: string
          job_steps: string | null
          job_title: string
          jsa_date: string | null
          location: string | null
          notes: string | null
          prepared_by: string | null
          required_ppe: string | null
          updated_at: string
        }
        Insert: {
          controls?: string | null
          created_at?: string
          created_by?: string | null
          hazards?: string | null
          id?: string
          job_steps?: string | null
          job_title: string
          jsa_date?: string | null
          location?: string | null
          notes?: string | null
          prepared_by?: string | null
          required_ppe?: string | null
          updated_at?: string
        }
        Update: {
          controls?: string | null
          created_at?: string
          created_by?: string | null
          hazards?: string | null
          id?: string
          job_steps?: string | null
          job_title?: string
          jsa_date?: string | null
          location?: string | null
          notes?: string | null
          prepared_by?: string | null
          required_ppe?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_records: {
        Row: {
          asset: string
          asset_type: string | null
          completed_date: string | null
          cost: number | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          notes: string | null
          odometer_hours: string | null
          reported_date: string | null
          service_type: string | null
          status: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          asset: string
          asset_type?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          notes?: string | null
          odometer_hours?: string | null
          reported_date?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          asset?: string
          asset_type?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          notes?: string | null
          odometer_hours?: string | null
          reported_date?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
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
          po_number: string | null
          project_id: string
          status: string | null
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
          po_number?: string | null
          project_id: string
          status?: string | null
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
          po_number?: string | null
          project_id?: string
          status?: string | null
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
          sort_order: number | null
          status: string | null
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
          sort_order?: number | null
          status?: string | null
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
          sort_order?: number | null
          status?: string | null
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
          sort_order: number | null
          status: string | null
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
          sort_order?: number | null
          status?: string | null
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
          sort_order?: number | null
          status?: string | null
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
          created_at: string
          created_by: string | null
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
          created_at?: string
          created_by?: string | null
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
          created_at?: string
          created_by?: string | null
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
      purchasing_logs: {
        Row: {
          contract_amount: number | null
          contract_issued: string | null
          contractor: string | null
          cost_code: string | null
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
          cost_code?: string | null
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
          cost_code?: string | null
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
          description: string | null
          id: string
          issue_date: string | null
          notes: string | null
          project_id: string
          rfi_number: string | null
          updated_at: string
        }
        Insert: {
          closed?: boolean
          cost_impact?: number | null
          created_at?: string
          created_by?: string | null
          date_received?: string | null
          date_required?: string | null
          description?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          project_id: string
          rfi_number?: string | null
          updated_at?: string
        }
        Update: {
          closed?: boolean
          cost_impact?: number | null
          created_at?: string
          created_by?: string | null
          date_received?: string | null
          date_required?: string | null
          description?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          project_id?: string
          rfi_number?: string | null
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
          delay_description: string | null
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
          delay_description?: string | null
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
          delay_description?: string | null
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
      subcontractor_prequalifications: {
        Row: {
          coi_expires: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          emr: number | null
          id: string
          notes: string | null
          osha_citations: string | null
          review_date: string | null
          status: string | null
          trade: string | null
          updated_at: string
        }
        Insert: {
          coi_expires?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          emr?: number | null
          id?: string
          notes?: string | null
          osha_citations?: string | null
          review_date?: string | null
          status?: string | null
          trade?: string | null
          updated_at?: string
        }
        Update: {
          coi_expires?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          emr?: number | null
          id?: string
          notes?: string | null
          osha_citations?: string | null
          review_date?: string | null
          status?: string | null
          trade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      submittal_logs: {
        Row: {
          closed: boolean
          created_at: string
          created_by: string | null
          date_received: string | null
          date_required: string | null
          description: string | null
          id: string
          issue_date: string | null
          notes: string | null
          project_id: string
          submittal_number: string | null
          updated_at: string
        }
        Insert: {
          closed?: boolean
          created_at?: string
          created_by?: string | null
          date_received?: string | null
          date_required?: string | null
          description?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          project_id: string
          submittal_number?: string | null
          updated_at?: string
        }
        Update: {
          closed?: boolean
          created_at?: string
          created_by?: string | null
          date_received?: string | null
          date_required?: string | null
          description?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          project_id?: string
          submittal_number?: string | null
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
      toolbox_talks: {
        Row: {
          attendee_count: number | null
          attendees: string | null
          created_at: string
          created_by: string | null
          id: string
          key_points: string | null
          location: string | null
          notes: string | null
          presenter: string | null
          talk_date: string | null
          topic: string
          updated_at: string
        }
        Insert: {
          attendee_count?: number | null
          attendees?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key_points?: string | null
          location?: string | null
          notes?: string | null
          presenter?: string | null
          talk_date?: string | null
          topic: string
          updated_at?: string
        }
        Update: {
          attendee_count?: number | null
          attendees?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key_points?: string | null
          location?: string | null
          notes?: string | null
          presenter?: string | null
          talk_date?: string | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      trailer_inspections: {
        Row: {
          brakes_ok: boolean
          coupler_ok: boolean
          created_at: string
          created_by: string | null
          deck_floor_ok: boolean
          defects: string | null
          frame_welds_ok: boolean
          id: string
          inspection_date: string | null
          inspector_name: string | null
          landing_gear_ok: boolean
          lights_ok: boolean
          plate_registration_ok: boolean
          ramps_gates_ok: boolean
          safety_chains_ok: boolean
          status: string | null
          suspension_ok: boolean
          tie_downs_ok: boolean
          tires_wheels_ok: boolean
          trailer: string
          trailer_type: string | null
          updated_at: string
        }
        Insert: {
          brakes_ok?: boolean
          coupler_ok?: boolean
          created_at?: string
          created_by?: string | null
          deck_floor_ok?: boolean
          defects?: string | null
          frame_welds_ok?: boolean
          id?: string
          inspection_date?: string | null
          inspector_name?: string | null
          landing_gear_ok?: boolean
          lights_ok?: boolean
          plate_registration_ok?: boolean
          ramps_gates_ok?: boolean
          safety_chains_ok?: boolean
          status?: string | null
          suspension_ok?: boolean
          tie_downs_ok?: boolean
          tires_wheels_ok?: boolean
          trailer: string
          trailer_type?: string | null
          updated_at?: string
        }
        Update: {
          brakes_ok?: boolean
          coupler_ok?: boolean
          created_at?: string
          created_by?: string | null
          deck_floor_ok?: boolean
          defects?: string | null
          frame_welds_ok?: boolean
          id?: string
          inspection_date?: string | null
          inspector_name?: string | null
          landing_gear_ok?: boolean
          lights_ok?: boolean
          plate_registration_ok?: boolean
          ramps_gates_ok?: boolean
          safety_chains_ok?: boolean
          status?: string | null
          suspension_ok?: boolean
          tie_downs_ok?: boolean
          tires_wheels_ok?: boolean
          trailer?: string
          trailer_type?: string | null
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
      vehicle_inspections: {
        Row: {
          blinkers_ok: boolean
          brake_lights_ok: boolean
          clearance_lights_ok: boolean
          controls_ok: boolean
          created_at: string
          created_by: string | null
          defects: string | null
          fluids_ok: boolean
          guards_ok: boolean
          headlights_ok: boolean
          id: string
          inspection_date: string | null
          inspector_name: string | null
          odometer: number | null
          running_lights_ok: boolean
          status: string | null
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
          created_by?: string | null
          defects?: string | null
          fluids_ok?: boolean
          guards_ok?: boolean
          headlights_ok?: boolean
          id?: string
          inspection_date?: string | null
          inspector_name?: string | null
          odometer?: number | null
          running_lights_ok?: boolean
          status?: string | null
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
          created_by?: string | null
          defects?: string | null
          fluids_ok?: boolean
          guards_ok?: boolean
          headlights_ok?: boolean
          id?: string
          inspection_date?: string | null
          inspector_name?: string | null
          odometer?: number | null
          running_lights_ok?: boolean
          status?: string | null
          tires_ok?: boolean
          updated_at?: string
          vehicle?: string
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
