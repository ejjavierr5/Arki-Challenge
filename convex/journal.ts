import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get journal entries for a user
export const getJournalEntries = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return [];
    }

    const entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return entries.map((e) => ({
      id: e._id,
      text: e.text,
      time: e.createdAt,
    }));
  },
});

// Add journal entry
export const addJournalEntry = mutation({
  args: {
    clerkId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("journalEntries", {
      userId: user._id,
      text: args.text,
      createdAt: Date.now(),
    });
  },
});

// Delete journal entry
export const deleteJournalEntry = mutation({
  args: {
    clerkId: v.string(),
    entryId: v.id("journalEntries"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const entry = await ctx.db.get(args.entryId);
    if (entry && entry.userId === user._id) {
      await ctx.db.delete(args.entryId);
    }
  },
});
