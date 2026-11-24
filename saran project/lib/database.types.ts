export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      owner_access: {
        Row: {
          id: string
          email: string
          is_active: boolean
          role: 'OWNER'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          is_active?: boolean
          role?: 'OWNER'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          is_active?: boolean
          role?: 'OWNER'
          created_at?: string
          updated_at?: string
        }
      }
      owner_profile: {
        Row: {
          id: string
          email: string
          full_name: string
          designation: string
          phone: string | null
          lab_name: string
          lab_address: string
          lab_registration_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          designation?: string
          phone?: string | null
          lab_name?: string
          lab_address?: string
          lab_registration_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          designation?: string
          phone?: string | null
          lab_name?: string
          lab_address?: string
          lab_registration_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      referring_doctors: {
        Row: {
          id: string
          owner_id: string
          name: string
          qualification: string | null
          clinic_hospital: string | null
          phone: string | null
          email: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          qualification?: string | null
          clinic_hospital?: string | null
          phone?: string | null
          email?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          qualification?: string | null
          clinic_hospital?: string | null
          phone?: string | null
          email?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          owner_id: string
          name: string
          age: number | null
          gender: 'Female' | 'Male' | 'Other' | 'Prefer not to say' | 'Not specified' | null
          phone: string
          referring_doctor_id: string | null
          doctor: string | null
          date_of_birth: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id: string
          owner_id: string
          name: string
          age?: number | null
          gender?: 'Female' | 'Male' | 'Other' | 'Prefer not to say' | 'Not specified' | null
          phone: string
          referring_doctor_id?: string | null
          doctor?: string | null
          date_of_birth?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          age?: number | null
          gender?: 'Female' | 'Male' | 'Other' | 'Prefer not to say' | 'Not specified' | null
          phone?: string
          referring_doctor_id?: string | null
          doctor?: string | null
          date_of_birth?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
      }
      test_catalogue: {
        Row: {
          code: string
          owner_id: string | null
          name: string
          category: string
          normal_price: number
          discount_price: number
          parameters_count: number
          active: boolean
          is_panel: boolean
          notes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          code: string
          owner_id?: string | null
          name: string
          category: string
          normal_price: number
          discount_price: number
          parameters_count?: number
          active?: boolean
          is_panel?: boolean
          notes?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          code?: string
          owner_id?: string | null
          name?: string
          category?: string
          normal_price?: number
          discount_price?: number
          parameters_count?: number
          active?: boolean
          is_panel?: boolean
          notes?: Json
          created_at?: string
          updated_at?: string
        }
      }
      test_parameters: {
        Row: {
          id: string
          test_code: string
          name: string
          data_type: 'Numeric' | 'Qualitative' | 'Text' | 'Unconfigured'
          unit: string | null
          precision: number | null
          male_low: number | null
          male_high: number | null
          female_low: number | null
          female_high: number | null
          sort_order: number
          is_verified: boolean
        }
        Insert: {
          id?: string
          test_code: string
          name: string
          data_type: 'Numeric' | 'Qualitative' | 'Text' | 'Unconfigured'
          unit?: string | null
          precision?: number | null
          male_low?: number | null
          male_high?: number | null
          female_low?: number | null
          female_high?: number | null
          sort_order?: number
          is_verified?: boolean
        }
        Update: {
          id?: string
          test_code?: string
          name?: string
          data_type?: 'Numeric' | 'Qualitative' | 'Text' | 'Unconfigured'
          unit?: string | null
          precision?: number | null
          male_low?: number | null
          male_high?: number | null
          female_low?: number | null
          female_high?: number | null
          sort_order?: number
          is_verified?: boolean
        }
      }
      reference_intervals: {
        Row: {
          id: string
          parameter_id: string
          test_code: string
          gender: 'Male' | 'Female' | 'Both' | 'Children' | null
          age_min_years: number | null
          age_max_years: number | null
          low_value: number | null
          high_value: number | null
          qualitative_normal: string | null
          clinical_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parameter_id: string
          test_code: string
          gender?: 'Male' | 'Female' | 'Both' | 'Children' | null
          age_min_years?: number | null
          age_max_years?: number | null
          low_value?: number | null
          high_value?: number | null
          qualitative_normal?: string | null
          clinical_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parameter_id?: string
          test_code?: string
          gender?: 'Male' | 'Female' | 'Both' | 'Children' | null
          age_min_years?: number | null
          age_max_years?: number | null
          low_value?: number | null
          high_value?: number | null
          qualitative_normal?: string | null
          clinical_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      laboratory_orders: {
        Row: {
          id: string
          owner_id: string
          patient_id: string
          referring_doctor_id: string | null
          order_date: string
          status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled'
          total_amount: number
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id: string
          owner_id: string
          patient_id: string
          referring_doctor_id?: string | null
          order_date?: string
          status?: 'Pending' | 'Processing' | 'Completed' | 'Cancelled'
          total_amount?: number
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          owner_id?: string
          patient_id?: string
          referring_doctor_id?: string | null
          order_date?: string
          status?: 'Pending' | 'Processing' | 'Completed' | 'Cancelled'
          total_amount?: number
          created_at?: string
          updated_at?: string
          version?: number
        }
      }
      order_tests: {
        Row: {
          id: string
          order_id: string
          test_code: string
          test_name: string
          price: number
          status: 'Pending' | 'In Progress' | 'Completed'
        }
        Insert: {
          id?: string
          order_id: string
          test_code: string
          test_name: string
          price?: number
          status?: 'Pending' | 'In Progress' | 'Completed'
        }
        Update: {
          id?: string
          order_id?: string
          test_code?: string
          test_name?: string
          price?: number
          status?: 'Pending' | 'In Progress' | 'Completed'
        }
      }
      reports: {
        Row: {
          id: string
          owner_id: string
          patient_id: string
          order_id: string | null
          report_date: string
          subtotal_amount: number
          discount_amount: number
          final_amount: number
          payment_status: 'Paid' | 'Pending' | 'Partial'
          paid_amount: number
          status: 'Draft' | 'Issued' | 'Amended' | 'Cancelled'
          amends_report_id: string | null
          current_version: number
          storage_path: string | null
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id: string
          owner_id: string
          patient_id: string
          order_id?: string | null
          report_date?: string
          subtotal_amount?: number
          discount_amount?: number
          final_amount?: number
          payment_status?: 'Paid' | 'Pending' | 'Partial'
          paid_amount?: number
          status?: 'Draft' | 'Issued' | 'Amended' | 'Cancelled'
          amends_report_id?: string | null
          current_version?: number
          storage_path?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          owner_id?: string
          patient_id?: string
          order_id?: string | null
          report_date?: string
          subtotal_amount?: number
          discount_amount?: number
          final_amount?: number
          payment_status?: 'Paid' | 'Pending' | 'Partial'
          paid_amount?: number
          status?: 'Draft' | 'Issued' | 'Amended' | 'Cancelled'
          amends_report_id?: string | null
          current_version?: number
          storage_path?: string | null
          created_at?: string
          updated_at?: string
          version?: number
        }
      }
      report_versions: {
        Row: {
          id: string
          report_id: string
          version_number: number
          issued_at: string
          issued_by: string
          reason_for_amendment: string | null
          snapshot_data: Json
          storage_path: string | null
        }
        Insert: {
          id?: string
          report_id: string
          version_number?: number
          issued_at?: string
          issued_by: string
          reason_for_amendment?: string | null
          snapshot_data: Json
          storage_path?: string | null
        }
        Update: {
          id?: string
          report_id?: string
          version_number?: number
          issued_at?: string
          issued_by?: string
          reason_for_amendment?: string | null
          snapshot_data?: Json
          storage_path?: string | null
        }
      }
      report_results: {
        Row: {
          id: string
          owner_id: string
          report_id: string
          test_code: string | null
          test_name: string
          parameter_name: string
          result_value: string
          unit: string | null
          reference_interval: string | null
          is_abnormal: boolean
          flag: 'Normal' | 'High' | 'Low' | 'Critical' | 'Abnormal' | 'Pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          report_id: string
          test_code?: string | null
          test_name: string
          parameter_name: string
          result_value?: string
          unit?: string | null
          reference_interval?: string | null
          is_abnormal?: boolean
          flag?: 'Normal' | 'High' | 'Low' | 'Critical' | 'Abnormal' | 'Pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          report_id?: string
          test_code?: string | null
          test_name?: string
          parameter_name?: string
          result_value?: string
          unit?: string | null
          reference_interval?: string | null
          is_abnormal?: boolean
          flag?: 'Normal' | 'High' | 'Low' | 'Critical' | 'Abnormal' | 'Pending'
          created_at?: string
          updated_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          owner_id: string
          report_id: string
          patient_id: string
          amount: number
          payment_method: 'Cash' | 'UPI' | 'Card' | 'Bank transfer' | 'Cheque'
          payment_date: string
          reference_number: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id: string
          owner_id: string
          report_id: string
          patient_id: string
          amount: number
          payment_method: 'Cash' | 'UPI' | 'Card' | 'Bank transfer' | 'Cheque'
          payment_date?: string
          reference_number?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          report_id?: string
          patient_id?: string
          amount?: number
          payment_method?: 'Cash' | 'UPI' | 'Card' | 'Bank transfer' | 'Cheque'
          payment_date?: string
          reference_number?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      file_metadata: {
        Row: {
          id: string
          owner_id: string
          bucket_id: string
          file_path: string
          file_name: string
          file_size_bytes: number | null
          mime_type: string
          entity_type: 'patient_document' | 'issued_report' | 'laboratory_asset'
          entity_id: string
          sha256_checksum: string | null
          is_encrypted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          bucket_id: string
          file_path: string
          file_name: string
          file_size_bytes?: number | null
          mime_type: string
          entity_type: 'patient_document' | 'issued_report' | 'laboratory_asset'
          entity_id: string
          sha256_checksum?: string | null
          is_encrypted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          bucket_id?: string
          file_path?: string
          file_name?: string
          file_size_bytes?: number | null
          mime_type?: string
          entity_type?: 'patient_document' | 'issued_report' | 'laboratory_asset'
          entity_id?: string
          sha256_checksum?: string | null
          is_encrypted?: boolean
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          owner_id: string
          actor_id: string
          action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW_REPORT' | 'PRINT_REPORT' | 'EXPORT_DATA'
          entity_type: string
          entity_id: string
          ip_address: string | null
          user_agent: string | null
          details: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          owner_id: string
          actor_id: string
          action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW_REPORT' | 'PRINT_REPORT' | 'EXPORT_DATA'
          entity_type: string
          entity_id: string
          ip_address?: string | null
          user_agent?: string | null
          details?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          owner_id?: string
          actor_id?: string
          action?: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW_REPORT' | 'PRINT_REPORT' | 'EXPORT_DATA'
          entity_type?: string
          entity_id?: string
          ip_address?: string | null
          user_agent?: string | null
          details?: Json | null
          timestamp?: string
        }
      }
      lab_settings: {
        Row: {
          key: string
          owner_id: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          owner_id: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          owner_id?: string
          value?: Json
          updated_at?: string
        }
      }
    }
    Views: {
      payments_ledger: {
        Row: Database['public']['Tables']['payment_transactions']['Row']
      }
      lab_orders: {
        Row: Database['public']['Tables']['laboratory_orders']['Row']
      }
      test_results: {
        Row: Database['public']['Tables']['report_results']['Row']
      }
      file_attachments: {
        Row: Database['public']['Tables']['file_metadata']['Row']
      }
    }
  }
}
