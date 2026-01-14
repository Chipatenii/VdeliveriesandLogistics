"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    profile: any | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Listen for changes on auth state
        // This covers both initial load and subsequent state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event, session?.user?.id);

            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                try {
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .single();

                    if (profileError) {
                        console.error('Error fetching profile:', profileError);
                        setProfile(null);
                    } else {
                        setProfile(profileData);
                    }
                } catch (err) {
                    console.error('Profile fetch unexpected error:', err);
                    setProfile(null);
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);


    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            // onAuthStateChange will handle setting user/profile to null
            router.replace('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
