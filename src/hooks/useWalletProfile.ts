import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "../lib/supabase";

export function useWalletProfile() {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  async function fetchProfile() {
    if (!publicKey) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const walletAddress = publicKey.toBase58();
      const { data } = await supabase.getClient()
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletAddress)
        .maybeSingle();
      
      setProfile(data ?? null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, [publicKey]);

  return { profile, loading, refresh: fetchProfile, publicKey };
}

