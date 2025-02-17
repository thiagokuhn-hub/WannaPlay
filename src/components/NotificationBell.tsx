useEffect(() => {
  if (!user) return;

  const subscription = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        // Ensure created_at is properly formatted
        const notification = {
          ...payload.new,
          created_at: payload.new.created_at || new Date().toISOString()
        };
        setNotifications(prev => [...prev, notification]);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [user]);