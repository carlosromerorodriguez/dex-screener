import { supabase } from "./supabase";

export async function followUser(targetId: string) {
  const { data: { user } } = await supabase.getClient().auth.getUser();
  if (!user?.id || user.id === targetId) return;
  
  try {
    await supabase.getClient()
      .from("follows")
      .upsert({ follower: user.id, following: targetId });
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
}

export async function unfollowUser(targetId: string) {
  const { data: { user } } = await supabase.getClient().auth.getUser();
  if (!user?.id) return;
  
  try {
    await supabase.getClient()
      .from("follows")
      .delete()
      .match({ follower: user.id, following: targetId });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
}

export async function isFollowing(targetId: string): Promise<boolean> {
  const { data: { user } } = await supabase.getClient().auth.getUser();
  if (!user?.id) return false;
  
  try {
    const { count } = await supabase.getClient()
      .from("follows")
      .select("*", { count: "exact", head: true })
      .match({ follower: user.id, following: targetId });
    
    return (count ?? 0) > 0;
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}

