export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      venues: {
        Row: {
          id: string;
          slug: string;
          name: string;
          location: string | null;
          timezone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          location?: string | null;
          timezone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          location?: string | null;
          timezone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      venue_memberships: {
        Row: {
          id: string;
          user_id: string;
          venue_id: string;
          role: "admin" | "staff";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          venue_id: string;
          role: "admin" | "staff";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          venue_id?: string;
          role?: "admin" | "staff";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "venue_memberships_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "venue_memberships_venue_id_fkey";
            columns: ["venue_id"];
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          age: number | null;
          id_photo_url: string | null;
          avatar_url: string | null;
          bio: string | null;
          is_private: boolean;
          last_seen_at: string;
          blocked_until: string | null;
          blocked_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          age?: number | null;
          id_photo_url?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          is_private?: boolean;
          last_seen_at?: string;
          blocked_until?: string | null;
          blocked_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          age?: number | null;
          id_photo_url?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          is_private?: boolean;
          last_seen_at?: string;
          blocked_until?: string | null;
          blocked_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      venue_sessions: {
        Row: {
          id: string;
          profile_id: string;
          venue_id: string;
          status: "active" | "ended";
          entered_at: string;
          exited_at: string | null;
          device_fingerprint: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          venue_id: string;
          status?: "active" | "ended";
          entered_at?: string;
          exited_at?: string | null;
          device_fingerprint?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          venue_id?: string;
          status?: "active" | "ended";
          entered_at?: string;
          exited_at?: string | null;
          device_fingerprint?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "venue_sessions_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "venue_sessions_venue_id_fkey";
            columns: ["venue_id"];
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      interactions: {
        Row: {
          id: string;
          venue_session_id: string | null;
          sender_id: string;
          receiver_id: string;
          interaction_type: "like" | "invite";
          status: "pending" | "accepted" | "declined" | "expired";
          message: string | null;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          venue_session_id?: string | null;
          sender_id: string;
          receiver_id: string;
          interaction_type: "like" | "invite";
          status?: "pending" | "accepted" | "declined" | "expired";
          message?: string | null;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          venue_session_id?: string | null;
          sender_id?: string;
          receiver_id?: string;
          interaction_type?: "like" | "invite";
          status?: "pending" | "accepted" | "declined" | "expired";
          message?: string | null;
          created_at?: string;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "interactions_receiver_id_fkey";
            columns: ["receiver_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interactions_sender_id_fkey";
            columns: ["sender_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interactions_venue_session_id_fkey";
            columns: ["venue_session_id"];
            referencedRelation: "venue_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          interaction_id: string;
          profile_a: string;
          profile_b: string;
          whatsapp_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          interaction_id: string;
          profile_a: string;
          profile_b: string;
          whatsapp_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          interaction_id?: string;
          profile_a?: string;
          profile_b?: string;
          whatsapp_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_interaction_id_fkey";
            columns: ["interaction_id"];
            referencedRelation: "interactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_profile_a_fkey";
            columns: ["profile_a"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_profile_b_fkey";
            columns: ["profile_b"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      song_requests: {
        Row: {
          id: string;
          profile_id: string;
          venue_id: string;
          song_title: string;
          artist: string | null;
          status: "pending" | "completed" | "cancelled";
          notes: string | null;
          whatsapp_thread_url: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          venue_id: string;
          song_title: string;
          artist?: string | null;
          status?: "pending" | "completed" | "cancelled";
          notes?: string | null;
          whatsapp_thread_url?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          venue_id?: string;
          song_title?: string;
          artist?: string | null;
          status?: "pending" | "completed" | "cancelled";
          notes?: string | null;
          whatsapp_thread_url?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "song_requests_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "song_requests_venue_id_fkey";
            columns: ["venue_id"];
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      offers: {
        Row: {
          id: string;
          venue_id: string;
          title: string;
          description: string | null;
          cta_label: string | null;
          cta_url: string | null;
          image_url: string | null;
          start_at: string;
          end_at: string | null;
          is_active: boolean;
          priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          title: string;
          description?: string | null;
          cta_label?: string | null;
          cta_url?: string | null;
          image_url?: string | null;
          start_at?: string;
          end_at?: string | null;
          is_active?: boolean;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          title?: string;
          description?: string | null;
          cta_label?: string | null;
          cta_url?: string | null;
          image_url?: string | null;
          start_at?: string;
          end_at?: string | null;
          is_active?: boolean;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offers_venue_id_fkey";
            columns: ["venue_id"];
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_blocks: {
        Row: {
          id: string;
          profile_id: string;
          blocked_profile_id: string;
          venue_id: string | null;
          blocked_by: string | null;
          reason: string | null;
          blocked_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          blocked_profile_id: string;
          venue_id?: string | null;
          blocked_by?: string | null;
          reason?: string | null;
          blocked_until?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          blocked_profile_id?: string;
          venue_id?: string | null;
          blocked_by?: string | null;
          reason?: string | null;
          blocked_until?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_blocks_blocked_profile_id_fkey";
            columns: ["blocked_profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_blocks_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_blocks_venue_id_fkey";
            columns: ["venue_id"];
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_blocks_blocked_by_fkey";
            columns: ["blocked_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      vw_active_sessions: {
        Row: {
          id: string | null;
          profile_id: string | null;
          venue_id: string | null;
          entered_at: string | null;
          observed_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vw_active_sessions_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vw_active_sessions_venue_id_fkey";
            columns: ["venue_id"];
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      vw_daily_matches: {
        Row: {
          match_date: string | null;
          matches_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

