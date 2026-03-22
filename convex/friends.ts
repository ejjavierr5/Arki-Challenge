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
    const friendshipsAsAdder = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get friend relationships where user was added by others
    const friendshipsAsAdded = await ctx.db
      .query("friends")
      .filter((q) => q.eq(q.field("friendUserId"), user._id))
      .collect();

    // Collect all unique friends
    const friendUserIds = new Set<string>();
    const friendshipMap = new Map<string, number>();

    // Add friends that user added
    for (const friendship of friendshipsAsAdder) {
      const friendId = friendship.friendUserId.toString();
      friendUserIds.add(friendId);
      friendshipMap.set(friendId, friendship.addedAt);
    }

    // Add friends who added the user (use their addedAt time)
    for (const friendship of friendshipsAsAdded) {
      const friendId = friendship.userId.toString();
      if (!friendUserIds.has(friendId)) {
        friendUserIds.add(friendId);
        friendshipMap.set(friendId, friendship.addedAt);
      }
    }

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
    
    for (const friendUserId of friendUserIds) {
      const friend = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("_id"), friendUserId))
        .first();
      if (friend && friend.friendCode) {
        friendsData.push({
          id: friend.friendCode,
          name: friend.name,
          title: friend.title || "Student Architect",
          school: friend.school || "",
          firm: friend.firm || "",
          avatarUrl: friend.imageUrl || "",
          specialties: friend.specialties || [],
          addedAt: friendshipMap.get(friendUserId) || Date.now(),
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

    // Check if already friends (check both directions)
    const existingFriendship1 = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("friendUserId"), friendUser._id))
      .first();
    
    const existingFriendship2 = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", friendUser._id))
      .filter((q) => q.eq(q.field("friendUserId"), user._id))
      .first();

    if (existingFriendship1 || existingFriendship2) {
      throw new Error("Already friends with this user");
    }

    // Create bidirectional friendship records
    const addedAt = Date.now();
    
    // User adds friend
    await ctx.db.insert("friends", {
      userId: user._id,
      friendUserId: friendUser._id,
      addedAt: addedAt,
    });
    
    // Friend gets user as friend (reciprocal relationship)
    return await ctx.db.insert("friends", {
      userId: friendUser._id,
      friendUserId: user._id,
      addedAt: addedAt,
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

    // Find and delete both directions of the friendship
    const friendship1 = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("friendUserId"), friendUser._id))
      .first();

    const friendship2 = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", friendUser._id))
      .filter((q) => q.eq(q.field("friendUserId"), user._id))
      .first();

    // Delete both friendship records if they exist
    if (friendship1) {
      await ctx.db.delete(friendship1._id);
    }
    
    if (friendship2) {
      await ctx.db.delete(friendship2._id);
    }
  },
});