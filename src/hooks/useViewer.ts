import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useViewer() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  async function fetchAll() {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.getClient().auth.getUser();
      setUser(authUser ?? null);
      
      if (authUser?.id) {
        const { data } = await supabase.getClient()
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();
        setProfile(data ?? null);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching viewer:", error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);
  
  return { user, profile, loading, refresh: fetchAll };
}

