import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Player } from '../types'

export function useAuth() {
  const [user, setUser] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async (userId: string) => {
    try {
      // Fix the query structure - don't use select('*, is_admin')
      // Instead, just use select('*') since is_admin should be a column in profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
      if (error) {
        console.error('Error fetching user:', error);
        setLoading(false);
        return null;
      }
    
      setUser(data);
      setLoading(false);
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUser(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUser(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Remove this problematic useEffect
  // useEffect(() => {
  //   if (session?.user) {
  //     fetchUser(session.user.id).then(userData => {
  //       if (userData) {
  //         setUser(userData);
  //       }
  //     });
  //   } else {
  //     setUser(null);
  //   }
  // }, [session]);

  const signUp = async (userData: Omit<Player, 'id'>) => {
    try {
      // Modify the query to handle multiple rows
      const { data: existingProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userData.email);
    
      if (profileError) {
        console.error('Error checking existing profiles:', profileError);
        throw new Error('Erro ao verificar perfis existentes');
      }
    
      // Check if any profiles exist with the given email
      if (existingProfiles && existingProfiles.length > 0) {
        throw new Error('Este email já está cadastrado');
      }
    
      // Rest of the signUp function remains the same
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
            padel_category: userData.padelCategory || null,
            beach_tennis_category: userData.beachTennisCategory || null,
            tennis_category: userData.tennisCategory || null,
            avatar: userData.avatar || null,
            cep: userData.cep || '',
            preferred_sports: userData.preferredSports || ['padel', 'beach-tennis'],
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
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error signing up:', error);
      throw new Error('Erro ao criar conta');
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
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
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*, is_admin')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        return { success: true, user: profile };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

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
  // Update the updateProfile function to handle the camelCase to snake_case conversion
  const updateProfile = async (data: Partial<Player>) => {
    try {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          phone: data.phone,
          email: data.email,
          gender: data.gender,
          padel_category: data.padel_category || data.padelCategory,
          beach_tennis_category: data.beach_tennis_category || data.beachTennisCategory,
          tennis_category: data.tennis_category || data.tennisCategory,
          playing_side: data.playing_side || data.playingSide,
          preferred_sports: data.preferred_sports,
          show_only_group_content: data.show_only_group_content,
          avatar: data.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)
        .select()
        .single();
  
      if (error) throw error;
      
      // Update the local user state
      setUser(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  

  // Single implementation of signInWithGoogle
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
  
      if (error) throw error;
    
      // Get user data after successful sign in
      const {
        data: { session },
      } = await supabase.auth.getSession();
  
      if (session?.user) {
        // Get user metadata which includes the picture
        const googleData = session.user.user_metadata;
        const avatarUrl = googleData.picture || googleData.avatar_url;
  
        console.log('Avatar URL:', avatarUrl); // Debug log
  
        // First check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
  
        // Update or create profile with Google avatar
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            avatar: avatarUrl, // Ensure avatar is saved
            name: googleData.full_name || googleData.name,
            email: session.user.email,
            updated_at: new Date().toISOString(),
            // Preserve existing data if profile exists
            ...(existingProfile && {
              phone: existingProfile.phone,
              playing_side: existingProfile.playing_side,
              gender: existingProfile.gender,
              padel_category: existingProfile.padel_category,
              beach_tennis_category: existingProfile.beach_tennis_category,
              cep: existingProfile.cep
            }),
            // Set defaults for new profiles
            ...(!existingProfile && {
              playing_side: 'both',
              gender: 'other',
              created_at: new Date().toISOString()
            })
          }, {
            onConflict: 'id'
          });
  
        if (updateError) throw updateError;
  
        // Fetch updated user data
        await fetchUser(session.user.id);
      }
    
      return data;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Add the deleteAccount function BEFORE the return statement
  // Improve the deleteAccount function
  const deleteAccount = async () => {
    try {
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
  
      console.log('Attempting to delete user profile with ID:', user.id);
  
      // First, get the current session to ensure we have the auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão não encontrada. Faça login novamente.');
      }

      // Delete the user's profile from the profiles table with explicit auth
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw profileError;
      }

      console.log('Profile deleted successfully');

      // Try to delete the user from auth (this might require admin rights)
      try {
        // This is a client-side approach - might not work without admin rights
        const { error: authError } = await supabase.rpc('delete_user');
        if (authError) {
          console.warn('Could not delete auth user (might require admin rights):', authError);
        }
      } catch (authDeleteError) {
        console.warn('Auth deletion failed (expected if not admin):', authDeleteError);
      }

      // Then sign out the user
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      // Clear the local user state
      setUser(null);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  // Add deleteAccount to the returned object
  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    signInWithGoogle,
    deleteAccount // Add this to the return object
  };
}