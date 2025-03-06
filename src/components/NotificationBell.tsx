useEffect(() => {
  if (!user) return;

  const subscription = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: '*',  // Listen for all events
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        // Handle deletions
        if (payload.eventType === 'DELETE') {
          setNotifications(prev => 
            prev.filter(n => n.id !== payload.old.id)
          );
        }
        // Handle inserts
        else if (payload.eventType === 'INSERT') {
          const notification = {
            ...payload.new,
            created_at: payload.new.created_at || new Date().toISOString()
          };
          setNotifications(prev => [...prev, notification]);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [user]);
// In your clear button click handler:
const handleClear = () => {
  if (user) {
    handleClearAllNotifications(user.id);
  }
};