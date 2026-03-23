import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all projects data for a user
export const getUserProjects = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return { accepted: {}, submitted: [], uploadedFiles: {} };
    }

    // Get accepted projects
    const acceptedProjects = await ctx.db
      .query("acceptedProjects")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const accepted: Record<string, number> = {};
    for (const p of acceptedProjects) {
      accepted[p.projectId] = p.acceptedAt;
    }

    // Get submitted projects
    const submittedProjects = await ctx.db
      .query("submittedProjects")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const submitted = submittedProjects.map((p) => p.projectId);

    // Get uploaded files
    const files = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const uploadedFiles: Record<string, Record<string, { name: string; driveId: string | undefined; uploadedAt: number }>> = {};
    for (const f of files) {
      if (!uploadedFiles[f.projectId]) {
        uploadedFiles[f.projectId] = {};
      }
      uploadedFiles[f.projectId][f.fileType] = {
        name: f.fileName,
        driveId: f.driveId,
        uploadedAt: f.uploadedAt,
      };
    }

    return { accepted, submitted, uploadedFiles };
  },
});

// Accept a project
export const acceptProject = mutation({
  args: {
    clerkId: v.string(),
    projectId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already accepted
    const existing = await ctx.db
      .query("acceptedProjects")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", user._id).eq("projectId", args.projectId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("acceptedProjects", {
      userId: user._id,
      projectId: args.projectId,
      acceptedAt: Date.now(),
    });
  },
});

// Discard/remove an accepted project
export const discardProject = mutation({
  args: {
    clerkId: v.string(),
    projectId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const accepted = await ctx.db
      .query("acceptedProjects")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", user._id).eq("projectId", args.projectId)
      )
      .first();

    if (accepted) {
      await ctx.db.delete(accepted._id);
    }

    // Also delete any uploaded files for this project
    const files = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", user._id).eq("projectId", args.projectId)
      )
      .collect();

    for (const file of files) {
      await ctx.db.delete(file._id);
    }
  },
});

// Submit/complete a project
export const submitProject = mutation({
  args: {
    clerkId: v.string(),
    projectId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already submitted
    const existing = await ctx.db
      .query("submittedProjects")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", user._id).eq("projectId", args.projectId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("submittedProjects", {
      userId: user._id,
      projectId: args.projectId,
      submittedAt: Date.now(),
    });
  },
});

// Upload file for a project
export const uploadFile = mutation({
  args: {
    clerkId: v.string(),
    projectId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    driveId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if file type already uploaded for this project
    const existingFiles = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", user._id).eq("projectId", args.projectId)
      )
      .collect();

    const existingFile = existingFiles.find((f) => f.fileType === args.fileType);

    if (existingFile) {
      await ctx.db.patch(existingFile._id, {
        fileName: args.fileName,
        driveId: args.driveId,
        uploadedAt: Date.now(),
      });
      return existingFile._id;
    }

    return await ctx.db.insert("uploadedFiles", {
      userId: user._id,
      projectId: args.projectId,
      fileName: args.fileName,
      fileType: args.fileType,
      driveId: args.driveId,
      uploadedAt: Date.now(),
    });
  },
});
