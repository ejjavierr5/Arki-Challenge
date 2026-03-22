import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get friends list for a user with their profile data
export const getFriends = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return [];
    }

    // Get friend relationships where user is the one who added friends
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get the actual friend user data
    const friendsData: Array<{
      id: string;
      name: string;
      title: string;
      school: string;
      firm: string;
      avatarUrl: string;
      specialties: string[];
      addedAt: number;
    }> = [];
    
    for (const friendship of friendships) {
      const friend = await ctx.db.get(friendship.friendUserId);
      if (friend) {
        friendsData.push({
          id: friend.friendCode,
          name: friend.name,
          title: friend.title || "Student Architect",
          school: friend.school || "",
          firm: friend.firm || "",
          avatarUrl: friend.imageUrl || "",
          specialties: friend.specialties || [],
          addedAt: friendship.addedAt,
        });
      }
    }

    return friendsData.sort((a, b) => b.addedAt - a.addedAt);
  },
});

// Look up a user by their friend code
export const getUserByFriendCode = query({
  args: { friendCode: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_friend_code", (q) => q.eq("friendCode", args.friendCode))
      .first();

    if (!user) {
      return null;
    }

    return {
      id: user._id,
      friendCode: user.friendCode,
      name: user.name,
      title: user.title || "Student Architect",
      school: user.school || "",
      firm: user.firm || "",
      avatarUrl: user.imageUrl || "",
      specialties: user.specialties || [],
    };
  },
});

// Add a friend by their friend code
export const addFriend = mutation({
  args: {
    clerkId: v.string(),
    friendCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if it's their own code
    if (user.friendCode === args.friendCode) {
      throw new Error("Cannot add yourself as a friend");
    }

    // Find the friend by their code
    const friendUser = await ctx.db
      .query("users")
      .withIndex("by_friend_code", (q) => q.eq("friendCode", args.friendCode))
      .first();

    if (!friendUser) {
      throw new Error("Friend code not found");
    }

    // Check if already friends
    const existingFriendship = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("friendUserId"), friendUser._id))
      .first();

    if (existingFriendship) {
      throw new Error("Already friends with this user");
    }

    // Add the friendship
    return await ctx.db.insert("friends", {
      userId: user._id,
      friendUserId: friendUser._id,
      addedAt: Date.now(),
    });
  },
});

// Remove a friend
export const removeFriend = mutation({
  args: {
    clerkId: v.string(),
    friendCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find the friend by their code
    const friendUser = await ctx.db
      .query("users")
      .withIndex("by_friend_code", (q) => q.eq("friendCode", args.friendCode))
      .first();

    if (!friendUser) {
      throw new Error("Friend not found");
    }

    // Find and delete the friendship
    const friendship = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("friendUserId"), friendUser._id))
      .first();

    if (friendship) {
      await ctx.db.delete(friendship._id);
    }
  },
});