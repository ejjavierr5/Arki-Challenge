// ADD THIS TABLE to your existing convex/schema.ts
// Inside the defineSchema({ ... }) object, add:

collaborations: defineTable({
  senderId: v.id("users"),
  recipientId: v.id("users"),
  recipientCode: v.string(),
  projectId: v.string(),
  projectTitle: v.string(),
  message: v.string(),
  status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
})
  .index("by_sender", ["senderId"])
  .index("by_recipient", ["recipientId"]),
