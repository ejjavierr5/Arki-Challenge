import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get challenge progress for a user
export const getChallengeProgress = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null;
    }

    // Get the most recent active challenge
    const challenges = await ctx.db
      .query("challengeProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Return the most recent uncompleted challenge
    const activeChallenge = challenges
      .filter((c) => !c.completedAt)
      .sort((a, b) => b.acceptedAt - a.acceptedAt)[0];

    if (!activeChallenge) {
      return null;
    }

    return {
      title: activeChallenge.challengeTitle,
      acceptedAt: activeChallenge.acceptedAt,
      done: false,
      files: activeChallenge.files,
    };
  },
});

// Accept a daily challenge
export const acceptChallenge = mutation({
  args: {
    clerkId: v.string(),
    challengeTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("challengeProgress", {
      userId: user._id,
      challengeTitle: args.challengeTitle,
      acceptedAt: Date.now(),
    });
  },
});

// Complete a challenge
export const completeChallenge = mutation({
  args: {
    clerkId: v.string(),
    files: v.optional(
      v.array(
        v.object({
          name: v.string(),
          driveId: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find the active challenge
    const challenges = await ctx.db
      .query("challengeProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const activeChallenge = challenges
      .filter((c) => !c.completedAt)
      .sort((a, b) => b.acceptedAt - a.acceptedAt)[0];

    if (activeChallenge) {
      await ctx.db.patch(activeChallenge._id, {
        completedAt: Date.now(),
        files: args.files,
      });
    }
  },
});

// Abandon a challenge
export const abandonChallenge = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find and delete the active challenge
    const challenges = await ctx.db
      .query("challengeProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const activeChallenge = challenges
      .filter((c) => !c.completedAt)
      .sort((a, b) => b.acceptedAt - a.acceptedAt)[0];

    if (activeChallenge) {
      await ctx.db.delete(activeChallenge._id);
    }
  },
});
