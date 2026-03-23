import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to get user by clerkId
async function getUserByClerkId(ctx: any, clerkId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .first();
}

// Get all invitations received by the current user
export const getInvitationsReceived = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await getUserByClerkId(ctx, clerkId);
    if (!user) return [];
    const invitations = await ctx.db
      .query("collaborations")
      .withIndex("by_recipient", (q: any) => q.eq("recipientId", user._id))
      .order("desc")
      .collect();
    // Attach sender info
    return await Promise.all(
      invitations.map(async (inv: any) => {
        const sender = await ctx.db.get(inv.senderId);
        return {
          ...inv,
          senderName: sender?.name || sender?.clerkId || "Unknown",
          createdAt: inv._creationTime,
        };
      })
    );
  },
});

// Get all invitations sent by the current user
export const getInvitationsSent = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await getUserByClerkId(ctx, clerkId);
    if (!user) return [];
    const invitations = await ctx.db
      .query("collaborations")
      .withIndex("by_sender", (q: any) => q.eq("senderId", user._id))
      .order("desc")
      .collect();
    return invitations.map((inv: any) => ({
      ...inv,
      createdAt: inv._creationTime,
    }));
  },
});

// Send a collaboration invitation
export const sendInvitation = mutation({
  args: {
    clerkId: v.string(),
    recipientCode: v.string(),
    projectId: v.string(),
    projectTitle: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, recipientCode, projectId, projectTitle, message }) => {
    const sender = await getUserByClerkId(ctx, clerkId);
    if (!sender) throw new Error("Sender not found");

    // Find recipient by friendCode
    const recipient = await ctx.db
      .query("users")
      .withIndex("by_friend_code", (q: any) => q.eq("friendCode", recipientCode))
      .first();
    if (!recipient) throw new Error("Recipient not found. Check the peer code.");

    if (sender._id === recipient._id) throw new Error("You cannot invite yourself.");

    // Check for existing pending invitation
    const existing = await ctx.db
      .query("collaborations")
      .withIndex("by_sender", (q: any) => q.eq("senderId", sender._id))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("recipientId"), recipient._id),
          q.eq(q.field("projectId"), projectId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();
    if (existing) throw new Error("You already have a pending invitation to this person for this project.");

    await ctx.db.insert("collaborations", {
      senderId: sender._id,
      recipientId: recipient._id,
      recipientCode,
      projectId,
      projectTitle,
      message: message || "",
      status: "pending",
    });
  },
});

// Accept a collaboration invitation
export const acceptInvitation = mutation({
  args: { clerkId: v.string(), invitationId: v.id("collaborations") },
  handler: async (ctx, { clerkId, invitationId }) => {
    const user = await getUserByClerkId(ctx, clerkId);
    if (!user) throw new Error("User not found");
    const inv = await ctx.db.get(invitationId);
    if (!inv) throw new Error("Invitation not found");
    if (inv.recipientId !== user._id) throw new Error("Not authorized");
    await ctx.db.patch(invitationId, { status: "accepted" });
  },
});

// Decline a collaboration invitation
export const declineInvitation = mutation({
  args: { clerkId: v.string(), invitationId: v.id("collaborations") },
  handler: async (ctx, { clerkId, invitationId }) => {
    const user = await getUserByClerkId(ctx, clerkId);
    if (!user) throw new Error("User not found");
    const inv = await ctx.db.get(invitationId);
    if (!inv) throw new Error("Invitation not found");
    if (inv.recipientId !== user._id) throw new Error("Not authorized");
    await ctx.db.patch(invitationId, { status: "declined" });
  },
});

// Cancel a sent invitation
export const cancelInvitation = mutation({
  args: { clerkId: v.string(), invitationId: v.id("collaborations") },
  handler: async (ctx, { clerkId, invitationId }) => {
    const user = await getUserByClerkId(ctx, clerkId);
    if (!user) throw new Error("User not found");
    const inv = await ctx.db.get(invitationId);
    if (!inv) throw new Error("Invitation not found");
    if (inv.senderId !== user._id) throw new Error("Not authorized");
    await ctx.db.delete(invitationId);
  },
});
