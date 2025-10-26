import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useProfileStats(userId?: string | null) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    followers: number;
    following: number;
    badges: number;
    xp: number;
    level: number;
  }>({
    followers: 0,
    following: 0,
    badges: 0,
    xp: 0,
    level: 1,
  });

  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    
    (async () => {
      setLoading(true);
      try {
        const [
          { count: followers = 0 },
          { count: following = 0 },
          { count: badges = 0 },
          prof,
        ] = await Promise.all([
          supabase.getClient().from("follows").select("*", { count: "exact", head: true }).eq("following", userId),
          supabase.getClient().from("follows").select("*", { count: "exact", head: true }).eq("follower", userId),
          supabase.getClient().from("user_badges").select("*", { count: "exact", head: true }).eq("user_id", userId),
          supabase.getClient().from("profiles").select("xp,level").eq("id", userId).maybeSingle(),
        ]);
        
        if (ignore) return;
        
        setStats({
          followers: followers ?? 0,
          following: following ?? 0,
          badges: badges ?? 0,
          xp: prof.data?.xp ?? 0,
          level: prof.data?.level ?? 1,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    })();
    
    return () => {
      ignore = true;
    };
  }, [userId]);

  return { ...stats, loading };
}

