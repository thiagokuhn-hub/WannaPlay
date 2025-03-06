export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  hidden?: boolean;
  game_id?: string;
  availability_id?: string;
}