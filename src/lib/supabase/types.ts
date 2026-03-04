export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string;
          bio: string;
          full_name: string;
          id: string;
          pinned_project_id: string | null;
          role: string | null;
          social_links: Json;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string;
          bio?: string;
          full_name?: string;
          id: string;
          pinned_project_id?: string | null;
          role?: string | null;
          social_links?: Json;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string;
          bio?: string;
          full_name?: string;
          id?: string;
          pinned_project_id?: string | null;
          role?: string | null;
          social_links?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_pinned_project_id_fkey';
            columns: ['pinned_project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      project_insights: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          phase: string | null;
          project_id: string;
          sort_order: number;
          type: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          phase?: string | null;
          project_id: string;
          sort_order?: number;
          type: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          phase?: string | null;
          project_id?: string;
          sort_order?: number;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_insights_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      project_note_folders: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          project_id: string;
          sort_order: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          project_id: string;
          sort_order?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          project_id?: string;
          sort_order?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_note_folders_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      project_notes: {
        Row: {
          content_json: Json | null;
          created_at: string;
          deleted_at: string | null;
          folder_id: string | null;
          id: string;
          is_pinned: boolean;
          project_id: string;
          sort_order: number;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content_json?: Json | null;
          created_at?: string;
          deleted_at?: string | null;
          folder_id?: string | null;
          id?: string;
          is_pinned?: boolean;
          project_id: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content_json?: Json | null;
          created_at?: string;
          deleted_at?: string | null;
          folder_id?: string | null;
          id?: string;
          is_pinned?: boolean;
          project_id?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_notes_folder_id_fkey';
            columns: ['folder_id'];
            isOneToOne: false;
            referencedRelation: 'project_note_folders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_notes_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          archived_at: string | null;
          completed_at: string | null;
          created_at: string;
          deleted_at: string | null;
          description: Json | null;
          id: string;
          image_url: string | null;
          name: string;
          pre_archive_status: string | null;
          pre_trash_status: string | null;
          status: string;
          summary: string | null;
          target_responses: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: Json | null;
          id?: string;
          image_url?: string | null;
          name: string;
          pre_archive_status?: string | null;
          pre_trash_status?: string | null;
          status?: string;
          summary?: string | null;
          target_responses?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: Json | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          pre_archive_status?: string | null;
          pre_trash_status?: string | null;
          status?: string;
          summary?: string | null;
          target_responses?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      survey_answers: {
        Row: {
          created_at: string;
          id: string;
          question_id: string;
          response_id: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          created_at?: string;
          id?: string;
          question_id: string;
          response_id: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          created_at?: string;
          id?: string;
          question_id?: string;
          response_id?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_answers_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'survey_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'survey_answers_response_id_fkey';
            columns: ['response_id'];
            isOneToOne: false;
            referencedRelation: 'survey_responses';
            referencedColumns: ['id'];
          },
        ];
      };
      survey_questions: {
        Row: {
          config: Json;
          created_at: string;
          description: string | null;
          id: string;
          required: boolean;
          sort_order: number;
          survey_id: string;
          text: string;
          type: Database['public']['Enums']['question_type'];
          updated_at: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          description?: string | null;
          id?: string;
          required?: boolean;
          sort_order: number;
          survey_id: string;
          text: string;
          type: Database['public']['Enums']['question_type'];
          updated_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          description?: string | null;
          id?: string;
          required?: boolean;
          sort_order?: number;
          survey_id?: string;
          text?: string;
          type?: Database['public']['Enums']['question_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_questions_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          },
        ];
      };
      survey_responses: {
        Row: {
          completed_at: string | null;
          contact_email_encrypted: string | null;
          contact_name_encrypted: string | null;
          created_at: string;
          device_type: string | null;
          feedback: string | null;
          fingerprint: string | null;
          id: string;
          started_at: string;
          status: string;
          submitted_after_close: boolean;
          survey_id: string;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          contact_email_encrypted?: string | null;
          contact_name_encrypted?: string | null;
          created_at?: string;
          device_type?: string | null;
          feedback?: string | null;
          fingerprint?: string | null;
          id?: string;
          started_at?: string;
          status?: string;
          submitted_after_close?: boolean;
          survey_id: string;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          contact_email_encrypted?: string | null;
          contact_name_encrypted?: string | null;
          created_at?: string;
          device_type?: string | null;
          feedback?: string | null;
          fingerprint?: string | null;
          id?: string;
          started_at?: string;
          status?: string;
          submitted_after_close?: boolean;
          survey_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_responses_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          },
        ];
      };
      surveys: {
        Row: {
          archived_at: string | null;
          cancelled_at: string | null;
          completed_at: string | null;
          created_at: string;
          deleted_at: string | null;
          description: string;
          ends_at: string | null;
          id: string;
          max_respondents: number | null;
          pre_trash_status: string | null;
          previous_status: Database['public']['Enums']['survey_status'] | null;
          project_id: string;
          research_phase: string | null;
          slug: string | null;
          starts_at: string | null;
          status: Database['public']['Enums']['survey_status'];
          title: string;
          updated_at: string;
          user_id: string;
          view_count: number;
          visibility: string;
        };
        Insert: {
          archived_at?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description: string;
          ends_at?: string | null;
          id?: string;
          max_respondents?: number | null;
          pre_trash_status?: string | null;
          previous_status?: Database['public']['Enums']['survey_status'] | null;
          project_id: string;
          research_phase?: string | null;
          slug?: string | null;
          starts_at?: string | null;
          status?: Database['public']['Enums']['survey_status'];
          title: string;
          updated_at?: string;
          user_id: string;
          view_count?: number;
          visibility?: string;
        };
        Update: {
          archived_at?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string;
          ends_at?: string | null;
          id?: string;
          max_respondents?: number | null;
          pre_trash_status?: string | null;
          previous_status?: Database['public']['Enums']['survey_status'] | null;
          project_id?: string;
          research_phase?: string | null;
          slug?: string | null;
          starts_at?: string | null;
          status?: Database['public']['Enums']['survey_status'];
          title?: string;
          updated_at?: string;
          user_id?: string;
          view_count?: number;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'surveys_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cancel_email_change: { Args: never; Returns: undefined };
      change_project_status_with_cascade: {
        Args: { p_action: string; p_project_id: string; p_user_id: string };
        Returns: Json;
      };
      cleanup_abandoned_responses: { Args: never; Returns: undefined };
      complete_expired_surveys: { Args: never; Returns: undefined };
      decrypt_pii: { Args: { encrypted: string }; Returns: string };
      encrypt_pii: { Args: { plain_text: string }; Returns: string };
      get_dashboard_overview: { Args: { p_user_id: string }; Returns: Json };
      get_dashboard_stats: {
        Args: { p_days: number; p_user_id: string };
        Returns: Json;
      };
      get_email_change_status: {
        Args: never;
        Returns: {
          confirm_status: number;
          new_email: string;
        }[];
      };
      get_export_responses: {
        Args: { p_survey_id: string; p_user_id: string };
        Returns: {
          completed_at: string;
          contact_email: string;
          contact_name: string;
          feedback: string;
          id: string;
        }[];
      };
      get_project_detail_stats: {
        Args: { p_project_id: string; p_user_id: string };
        Returns: Json;
      };
      get_project_surveys_with_counts: {
        Args: { p_project_id: string; p_user_id: string };
        Returns: Json;
      };
      get_projects_list_extras: { Args: { p_user_id: string }; Returns: Json };
      get_research_journey: { Args: { p_user_id: string }; Returns: Json };
      get_survey_completion_timeline: {
        Args: { p_survey_id: string; p_user_id: string };
        Returns: Json;
      };
      get_survey_response_count: {
        Args: { p_survey_id: string };
        Returns: number;
      };
      get_survey_stats_data: {
        Args: { p_survey_id: string; p_user_id: string };
        Returns: Json;
      };
      get_user_id_by_email: { Args: { lookup_email: string }; Returns: string };
      get_user_surveys_with_counts: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      has_password: { Args: never; Returns: boolean };
      purge_trashed_projects: { Args: never; Returns: undefined };
      purge_trashed_surveys: { Args: never; Returns: undefined };
      record_survey_view: { Args: { p_survey_id: string }; Returns: undefined };
      save_survey_questions: {
        Args: { p_questions: Json; p_survey_id: string; p_user_id: string };
        Returns: undefined;
      };
      start_survey_response:
        | {
            Args: { p_device_type?: string; p_survey_id: string };
            Returns: string;
          }
        | {
            Args: {
              p_device_type?: string;
              p_fingerprint?: string;
              p_survey_id: string;
            };
            Returns: string;
          };
      submit_survey_response: {
        Args: {
          p_contact_email?: string;
          p_contact_name?: string;
          p_feedback?: string;
          p_response_id: string;
        };
        Returns: undefined;
      };
      validate_and_save_answer: {
        Args: { p_question_id: string; p_response_id: string; p_value: Json };
        Returns: undefined;
      };
      verify_password: {
        Args: { current_plain_password: string };
        Returns: boolean;
      };
    };
    Enums: {
      question_type: 'open_text' | 'short_text' | 'multiple_choice' | 'rating_scale' | 'yes_no';
      survey_status: 'draft' | 'active' | 'completed' | 'cancelled' | 'archived' | 'trashed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      question_type: ['open_text', 'short_text', 'multiple_choice', 'rating_scale', 'yes_no'],
      survey_status: ['draft', 'active', 'completed', 'cancelled', 'archived', 'trashed'],
    },
  },
} as const;
