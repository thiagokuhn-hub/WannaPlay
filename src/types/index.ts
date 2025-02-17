export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  created_at: string; // This should match the database field name
  read: boolean;
  game_id?: string;
}