import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useUserBadges(userId?: string | null) {
  const [loading, setLoading] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  
  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.getClient()
          .from("user_badges")
          .select("earned_at, badges:badge_id(id,slug,name,rarity,icon_url)")
          .eq("user_id", userId)
          .order("earned_at", { ascending: false });
        
        if (!ignore) {
          setBadges(data ?? []);
        }
      } catch (error) {
        console.error("Error fetching badges:", error);
        setBadges([]);
      } finally {
        setLoading(false);
      }
    })();
    
    return () => {
      ignore = true;
    };
  }, [userId]);
  
  return { badges, loading };
}

