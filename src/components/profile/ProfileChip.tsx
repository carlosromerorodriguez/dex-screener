import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletProfile } from "../../hooks/useWalletProfile";
import { useWalletStats } from "../../hooks/useWalletStats";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import { Dropdown, Item, Separator as DSep } from "../ui/DropdownMenu";
import { useAuthStore } from "../../state/authStore";
import { supabase } from "../../lib/supabase";

export default function ProfileChip() {
  const { publicKey, disconnect } = useWallet();
  const { profile, loading } = useWalletProfile();
  const stats = useWalletStats();
  const { openAuthModal } = useAuthStore();

  if (loading) {
    return <div className="w-24 h-10 rounded-xl bg-[#161b24] animate-pulse" />;
  }

  if (!publicKey) {
    return (
      <Button variant="default" onClick={() => openAuthModal()}>
        Sign in
      </Button>
    );
  }

  const handle = profile?.username ? `@${profile.username}` : "@user";
  const trigger = (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#161b24] border border-[#2c3344] cursor-pointer transition-colors">
      <Avatar src={profile?.avatar_url || null} alt={profile?.username} size={28} />
      <div className="hidden md:flex flex-col">
        <span className="text-sm text-white">{handle}</span>
        <span className="text-[11px] text-[#9aa0b2]">Lv {stats.level} · {stats.badges} badges</span>
      </div>
    </div>
  );

  return (
    <Dropdown trigger={trigger} align="end">
      <div className="px-3 py-2">
        <div className="text-white text-sm">{handle}</div>
        <div className="text-[11px] text-[#9aa0b2]">XP {stats.xp} · Lv {stats.level}</div>
      </div>
      <DSep />
      <div className="px-3 py-2 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-white text-sm">{stats.followers}</div>
          <div className="text-[11px] text-[#9aa0b2]">Followers</div>
        </div>
        <div>
          <div className="text-white text-sm">{stats.following}</div>
          <div className="text-[11px] text-[#9aa0b2]">Following</div>
        </div>
        <div>
          <div className="text-white text-sm">{stats.badges}</div>
          <div className="text-[11px] text-[#9aa0b2]">Badges</div>
        </div>
      </div>
      <DSep />
      <Item onClick={() => window.location.href = "/me"}>My Profile</Item>
      <Item onClick={() => window.location.href = "/settings"}>Settings</Item>
      <DSep />
      <Item
        onClick={async () => {
          disconnect();
          window.location.reload();
        }}
      >
        Sign out
      </Item>
    </Dropdown>
  );
}

