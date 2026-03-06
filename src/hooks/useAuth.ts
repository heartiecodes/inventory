import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const DUPLICATE_EMAIL_MESSAGE = "This email is already registered. Please sign in.";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) {
      const duplicateIndicators = ["already registered", "already exists", "user already"];
      const isDuplicate = duplicateIndicators.some((value) =>
        error.message.toLowerCase().includes(value)
      );

      if (isDuplicate) {
        throw new Error(DUPLICATE_EMAIL_MESSAGE);
      }

      throw error;
    }

    const identities = data.user?.identities;
    if (Array.isArray(identities) && identities.length === 0) {
      throw new Error(DUPLICATE_EMAIL_MESSAGE);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, session, loading, signUp, signIn, signOut };
}

export function useProfile() {
  const [profile, setProfile] = useState<{
    username: string;
    school_name: string | null;
    profile_image: string | null;
  } | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username, school_name, profile_image")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data);
  };

  const updateProfile = async (userId: string, updates: { school_name?: string; profile_image?: string }) => {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId);
    if (error) throw error;
    if (profile) setProfile({ ...profile, ...updates });
  };

  return { profile, fetchProfile, updateProfile };
}
