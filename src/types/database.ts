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
      players: {
        Row: {
          id: string
          name: string
          phone: string
          email: string
          password: string
          padel_category: string | null
          beach_tennis_category: string | null
          playing_side: string
          gender: string
          avatar: string | null
          is_admin: boolean
          blocked: boolean
          blocked_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['players']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['players']['Row']>
      }
      // Add other tables as needed
    }
  }
}