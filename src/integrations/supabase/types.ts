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
      app_secrets: {
        Row: {
          created_at: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      contact_leads: {
        Row: {
          ai_qualified_at: string | null
          ai_score: string | null
          ai_suggested_reply: string | null
          ai_summary: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string
          source: string
          status: string
        }
        Insert: {
          ai_qualified_at?: string | null
          ai_score?: string | null
          ai_suggested_reply?: string | null
          ai_summary?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name: string
          phone?: string
          source?: string
          status?: string
        }
        Update: {
          ai_qualified_at?: string | null
          ai_score?: string | null
          ai_suggested_reply?: string | null
          ai_summary?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          ai_qualified_at: string | null
          ai_score: string | null
          ai_suggested_reply: string | null
          ai_summary: string | null
          created_at: string
          email_normalized: string | null
          id: string
          last_interaction_at: string
          name: string | null
          notes: string | null
          owner_id: string | null
          phone_normalized: string | null
          raw_email: string | null
          raw_phone: string | null
          source_first: string | null
          source_last: string | null
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          ai_qualified_at?: string | null
          ai_score?: string | null
          ai_suggested_reply?: string | null
          ai_summary?: string | null
          created_at?: string
          email_normalized?: string | null
          id?: string
          last_interaction_at?: string
          name?: string | null
          notes?: string | null
          owner_id?: string | null
          phone_normalized?: string | null
          raw_email?: string | null
          raw_phone?: string | null
          source_first?: string | null
          source_last?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          ai_qualified_at?: string | null
          ai_score?: string | null
          ai_suggested_reply?: string | null
          ai_summary?: string | null
          created_at?: string
          email_normalized?: string | null
          id?: string
          last_interaction_at?: string
          name?: string | null
          notes?: string | null
          owner_id?: string | null
          phone_normalized?: string | null
          raw_email?: string | null
          raw_phone?: string | null
          source_first?: string | null
          source_last?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      crm_events: {
        Row: {
          contact_id: string
          created_at: string
          created_by: string | null
          id: string
          payload: Json
          source: string | null
          title: string | null
          type: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          source?: string | null
          title?: string | null
          type: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          source?: string | null
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      launches: {
        Row: {
          cover_url: string | null
          created_at: string
          delivery_date: string | null
          description: string | null
          highlights: string[]
          id: string
          location: string | null
          name: string
          photos: string[]
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          delivery_date?: string | null
          description?: string | null
          highlights?: string[]
          id?: string
          location?: string | null
          name: string
          photos?: string[]
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          delivery_date?: string | null
          description?: string | null
          highlights?: string[]
          id?: string
          location?: string | null
          name?: string
          photos?: string[]
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_leads: {
        Row: {
          ai_reasoning: string | null
          answers: Json
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          recommended_property_ids: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_reasoning?: string | null
          answers?: Json
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          recommended_property_ids?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_reasoning?: string | null
          answers?: Json
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          recommended_property_ids?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      neighborhoods: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author: string | null
          content: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          area_m2: number | null
          bedrooms: number | null
          code: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          is_new: boolean
          latitude: number | null
          longitude: number | null
          neighborhood_id: string | null
          neighborhood_name: string | null
          parking: number | null
          photos: string[]
          price: number | null
          property_type: string
          purpose: string
          slug: string
          status: string
          suites: number | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          area_m2?: number | null
          bedrooms?: number | null
          code?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_new?: boolean
          latitude?: number | null
          longitude?: number | null
          neighborhood_id?: string | null
          neighborhood_name?: string | null
          parking?: number | null
          photos?: string[]
          price?: number | null
          property_type: string
          purpose?: string
          slug: string
          status?: string
          suites?: number | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          area_m2?: number | null
          bedrooms?: number | null
          code?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_new?: boolean
          latitude?: number | null
          longitude?: number | null
          neighborhood_id?: string | null
          neighborhood_name?: string | null
          parking?: number | null
          photos?: string[]
          price?: number | null
          property_type?: string
          purpose?: string
          slug?: string
          status?: string
          suites?: number | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_leads: {
        Row: {
          address: string | null
          bedrooms: number | null
          created_at: string
          desired_price: number | null
          email: string | null
          id: string
          name: string
          neighborhood: string | null
          notes: string | null
          phone: string
          property_type: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          bedrooms?: number | null
          created_at?: string
          desired_price?: number | null
          email?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          notes?: string | null
          phone: string
          property_type?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          bedrooms?: number | null
          created_at?: string
          desired_price?: number | null
          email?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string
          property_type?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          client_name: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          photo_url: string | null
          rating: number
          text: string
        }
        Insert: {
          client_name: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          photo_url?: string | null
          rating?: number
          text: string
        }
        Update: {
          client_name?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          photo_url?: string | null
          rating?: number
          text?: string
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
      merge_lead: {
        Args: {
          p_email: string
          p_event_at?: string
          p_event_type: string
          p_name: string
          p_payload: Json
          p_phone: string
          p_source: string
          p_title: string
        }
        Returns: string
      }
      normalize_email: { Args: { e: string }; Returns: string }
      normalize_phone: { Args: { p: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "editor"
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
      app_role: ["admin", "editor"],
    },
  },
} as const
