import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles - synced with Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    school: v.optional(v.string()),
    firm: v.optional(v.string()),
    bio: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    designPreferences: v.optional(v.array(v.string())),
    friendCode: v.optional(v.string()), // Optional for backwards compatibility
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_friend_code", ["friendCode"]),

  // Accepted projects
  acceptedProjects: defineTable({
    userId: v.id("users"),
    projectId: v.string(),
    acceptedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_project", ["userId", "projectId"]),

  // Submitted/completed projects
  submittedProjects: defineTable({
    userId: v.id("users"),
    projectId: v.string(),
    submittedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_project", ["userId", "projectId"]),

  // Uploaded files for projects
  uploadedFiles: defineTable({
    userId: v.id("users"),
    projectId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    driveId: v.optional(v.string()),
    uploadedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_project", ["userId", "projectId"]),

  // Daily challenge progress
  challengeProgress: defineTable({
    userId: v.id("users"),
    challengeTitle: v.string(),
    acceptedAt: v.number(),
    completedAt: v.optional(v.number()),
    files: v.optional(v.array(v.object({
      name: v.string(),
      driveId: v.string(),
    }))),
  })
    .index("by_user", ["userId"]),

  // Journal entries
  journalEntries: defineTable({
    userId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Friends/peers
  friends: defineTable({
    userId: v.id("users"),
    friendUserId: v.id("users"),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_friend", ["friendUserId"]),
});
