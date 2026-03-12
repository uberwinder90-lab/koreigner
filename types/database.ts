export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          profile_image_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          profile_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          profile_image_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          description: string | null
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          title: string
          content: string | null
          author_id: string
          category_id: number
          views_count: number
          embedded_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          author_id: string
          category_id: number
          views_count?: number
          embedded_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          author_id?: string
          category_id?: number
          views_count?: number
          embedded_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'posts_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'posts_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      post_media: {
        Row: {
          id: string
          post_id: string
          file_url: string
          display_order: number
        }
        Insert: {
          id?: string
          post_id: string
          file_url: string
          display_order?: number
        }
        Update: {
          id?: string
          post_id?: string
          file_url?: string
          display_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'post_media_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
        ]
      }
      post_likes: {
        Row: {
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          post_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      post_reports: {
        Row: {
          id: string
          post_id: string
          user_id: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          reason?: string
          created_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          parent_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          parent_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          parent_id?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      email_verifications: {
        Row: {
          email: string
          code: string
          expires_at: string
        }
        Insert: {
          email: string
          code: string
          expires_at: string
        }
        Update: {
          email?: string
          code?: string
          expires_at?: string
        }
        Relationships: []
      }
      site_banners: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          link_url: string | null
          bg_color: string
          text_color: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          link_url?: string | null
          bg_color?: string
          text_color?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          link_url?: string | null
          bg_color?: string
          text_color?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
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
