import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "../lib/supabase.ts";

export function useWalletStats() {
  const { publicKey } = useWallet();
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
    if (!publicKey) return;
    let ignore = false;
    
    (async () => {
      setLoading(true);
      try {
        const walletAddress = publicKey.toBase58();
        
        const [
          { count: followers = 0 },
          { count: following = 0 },
          { count: badges = 0 },
          prof,
        ] = await Promise.all([
          supabase.getClient().from("follows").select("*", { count: "exact", head: true }).eq("following_wallet", walletAddress),
          supabase.getClient().from("follows").select("*", { count: "exact", head: true }).eq("follower_wallet", walletAddress),
          supabase.getClient().from("user_badges").select("*", { count: "exact", head: true }).eq("user_wallet_address", walletAddress),
          supabase.getClient().from("profiles").select("xp,level").eq("wallet_address", walletAddress).maybeSingle(),
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
  }, [publicKey]);

  return { ...stats, loading, publicKey };
}

