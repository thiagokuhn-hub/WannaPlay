import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Player } from '../types'

export function useAuth() {
  const [user, setUser] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUser(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUser(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, is_admin')
        .eq('id', userId)
        .single()

      if (error) throw error
      console.log('User data from database:', data) // Add this line to debug
      setUser({
        ...data,
        isAdmin: data.is_admin
      })
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (userData: Omit<Player, 'id'>) => {
    try {
      // First check if user already exists in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingProfile) {
        throw new Error('Este email já está cadastrado');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
            playing_side: userData.playingSide,
            gender: userData.gender,
            padel_category: userData.padelCategory,
            beach_tennis_category: userData.beachTennisCategory,
            avatar: userData.avatar,
            cep: userData.cep
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([{
            id: authData.user.id,
            email: userData.email,
            name: userData.name || '',
            phone: userData.phone || '',
            playing_side: userData.playingSide || 'both',
            gender: userData.gender || 'other',
            padel_category: userData.padelCategory || 'beginner',
            beach_tennis_category: userData.beachTennisCategory || 'beginner',
            avatar: userData.avatar || null,
            cep: userData.cep || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }], {
            onConflict: 'id'
          });
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error('Erro ao criar perfil do usuário');
        }

        await fetchUser(authData.user.id);
        return authData.user;
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Auth response:', { data, error });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos')
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor, confirme seu email antes de fazer login')
        }
        throw error
      }

      if (data.user) {
        console.log('Fetching user profile for ID:', data.user.id);
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        console.log('Profile response:', { userData, userError });

        if (userError) throw userError
        
        // Force a state update by creating a new object
        setUser({ ...userData })
        return { success: true, user: userData }
      }
      
      return { success: false, error: 'Login failed' }
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Add this function inside useAuth
  const updateProfile = async (data: Partial<Player>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          phone: data.phone,
          email: data.email,
          playing_side: data.playing_side || data.playingSide,
          gender: data.gender,
          padel_category: data.padel_category || data.padelCategory,
          beach_tennis_category: data.beach_tennis_category || data.beachTennisCategory,
          avatar: data.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Fetch updated user data
      if (user?.id) {
        await fetchUser(user.id);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    setUser,
    updateProfile,  // Add this line
  }
}