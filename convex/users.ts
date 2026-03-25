import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate unique friend code
function generateFriendCode(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const part1 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `ARCH-${part1}-${part2}`;
}

// Get current user by Clerk ID
export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user;
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Create or update user (upsert)
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // If user exists but doesn't have friendCode, generate one
      const updates: {
        email: string;
        name: string;
        imageUrl?: string;
        updatedAt: number;
        friendCode?: string;
      } = {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        updatedAt: now,
      };
      
      if (!existingUser.friendCode) {
        // Generate unique friend code for existing user
        let friendCode: string;
        let isUnique = false;
        do {
          friendCode = generateFriendCode();
          const existing = await ctx.db
            .query("users")
            .withIndex("by_friend_code", (q) => q.eq("friendCode", friendCode))
            .first();
          isUnique = !existing;
        } while (!isUnique);
        
        updates.friendCode = friendCode;
      }
      
      await ctx.db.patch(existingUser._id, updates);
      return existingUser._id;
    } else {
      // Generate unique friend code for new user
      let friendCode: string;
      let isUnique = false;
      do {
        friendCode = generateFriendCode();
        const existing = await ctx.db
          .query("users")
          .withIndex("by_friend_code", (q) => q.eq("friendCode", friendCode))
          .first();
        isUnique = !existing;
      } while (!isUnique);

      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        title: "Student Architect",
        specialties: [],
        designPreferences: [],
        friendCode,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    title: v.optional(v.string()),
    school: v.optional(v.string()),
    firm: v.optional(v.string()),
    bio: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    designPreferences: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const { clerkId: _, ...updates } = args;
    await ctx.db.patch(user._id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});
