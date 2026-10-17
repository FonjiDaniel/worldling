import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const role = v.union(v.literal("user"), v.literal("moderator"), v.literal("admin"));
export const accountStatus = v.union(
  v.literal("active"),
  v.literal("suspended"),
  v.literal("deleting"),
);
export const biome = v.union(
  v.literal("oceanic"),
  v.literal("verdant"),
  v.literal("desert"),
  v.literal("frozen"),
  v.literal("volcanic"),
  v.literal("crystal"),
);

const encryptedSecret = v.object({
  iv: v.string(),
  ct: v.string(),
  kv: v.number(),
  last4: v.string(),
});

export const worldParamsV1 = v.object({
  version: v.literal(1),
  seed: v.number(), // uint32
  biome,
  terrain: v.object({
    scale: v.number(), // 0.5..3
    roughness: v.number(), // 0..1
    amplitude: v.number(), // 0..0.25 of radius
    seaLevel: v.number(), // 0..1
  }),
  palette: v.object({
    id: v.string(), // curated id or "custom"
    stops: v.array(v.string()), // exactly 5 hex colors, clamped
  }),
  ocean: v.object({ color: v.string(), gloss: v.number() }),
  atmosphere: v.object({ color: v.string(), density: v.number() }),
  clouds: v.object({ coverage: v.number(), speed: v.number(), color: v.string() }),
  motion: v.object({ spin: v.number(), tilt: v.number() }),
  cosmetics: v.array(v.string()), // equipped cosmetic ids (validated vs entitlements)
});

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    username: v.string(), // lowercase, unique, ^[a-z0-9_]{3,20}$
    displayName: v.string(), // 1..40 chars
    role,
    status: accountStatus,
    suspension: v.optional(
      v.object({ reason: v.string(), byUserId: v.id("users"), at: v.number() }),
    ),
    emailPrefs: v.object({
      cometAlerts: v.boolean(),
      weeklyDigest: v.boolean(),
      productUpdates: v.boolean(),
    }),
    lastActiveDay: v.optional(v.string()), // "YYYY-MM-DD" UTC
    lastCometAlertAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"])
    .index("by_role", ["role"])
    .index("by_status", ["status"])
    .searchIndex("search_name", { searchField: "displayName", filterFields: ["status"] }),

  worlds: defineTable({
    ownerId: v.id("users"),
    isPrimary: v.boolean(),
    name: v.string(), // 1..32 chars
    params: worldParamsV1,
    slot: v.number(), // galaxy slot, never reused
    sectorKey: v.string(), // "x:z", derived from slot
    bloom: v.object({
      xp: v.number(),
      level: v.number(),
      streak: v.number(),
      lastTendedDay: v.optional(v.string()),
    }),
    thumbnailId: v.optional(v.id("_storage")),
    visibility: v.union(v.literal("public"), v.literal("hidden")), // hidden = moderation
    featuredAt: v.optional(v.number()),
    cometReview: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_sector", ["sectorKey"])
    .index("by_slot", ["slot"])
    .index("by_featured", ["featuredAt"]),

  galaxy: defineTable({ nextSlot: v.number() }), // singleton

  worldVisits: defineTable({
    worldId: v.id("worlds"),
    visitorId: v.id("users"),
    day: v.string(),
  })
    .index("by_world_visitor_day", ["worldId", "visitorId", "day"])
    .index("by_visitor", ["visitorId"]),

  comets: defineTable({
    worldId: v.id("worlds"),
    authorId: v.id("users"),
    body: v.string(),
    status: v.union(
      v.literal("visible"),
      v.literal("pending"),
      v.literal("hidden"),
      v.literal("removed"),
    ),
    hiddenReason: v.optional(
      v.union(v.literal("owner"), v.literal("reports"), v.literal("moderator")),
    ),
    reportCount: v.number(),
  })
    .index("by_world_status", ["worldId", "status"])
    .index("by_author", ["authorId"])
    .index("by_status", ["status"]),

  bloomQueue: defineTable({
    worldId: v.id("worlds"),
    kind: v.union(
      v.literal("tend"),
      v.literal("visit"),
      v.literal("comet_received"),
      v.literal("comet_sent"),
    ),
    actorId: v.optional(v.id("users")),
    day: v.string(),
  }),

  worldStatsDaily: defineTable({
    worldId: v.id("worlds"),
    day: v.string(),
    visits: v.number(),
    cometsReceived: v.number(),
    cometsSent: v.number(),
    xpGained: v.number(),
  })
    .index("by_world_day", ["worldId", "day"])
    .index("by_day", ["day"]),

  reports: defineTable({
    targetType: v.union(v.literal("comet"), v.literal("world"), v.literal("profile")),
    targetId: v.string(),
    reporterId: v.id("users"),
    reason: v.union(
      v.literal("harassment"),
      v.literal("hate"),
      v.literal("sexual"),
      v.literal("spam"),
      v.literal("self_harm"),
      v.literal("other"),
    ),
    note: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("resolved"), v.literal("dismissed")),
    resolution: v.optional(
      v.object({ byUserId: v.id("users"), action: v.string(), at: v.number() }),
    ),
  })
    .index("by_status", ["status"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_target_reporter", ["targetType", "targetId", "reporterId"]),

  blocks: defineTable({ blockerId: v.id("users"), blockedId: v.id("users") })
    .index("by_pair", ["blockerId", "blockedId"])
    .index("by_blocked", ["blockedId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("comet_received"), v.literal("level_up"), v.literal("comet_moderated")),
    data: v.object({
      worldId: v.optional(v.id("worlds")),
      cometId: v.optional(v.id("comets")),
      level: v.optional(v.number()),
    }),
    readAt: v.optional(v.number()),
    emailedAt: v.optional(v.number()),
  }).index("by_user_read", ["userId", "readAt"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(), // typed by the registry in lib/settings.ts
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  emailConfigs: defineTable({
    status: v.union(
      v.literal("draft"),
      v.literal("verified"),
      v.literal("active"),
      v.literal("retired"),
    ),
    transport: v.union(v.literal("smtp"), v.literal("resend")),
    fromName: v.string(),
    fromAddress: v.string(),
    replyTo: v.optional(v.string()),
    smtp: v.optional(
      v.object({
        host: v.string(),
        port: v.number(),
        secure: v.boolean(),
        user: v.string(),
        password: v.optional(encryptedSecret),
      }),
    ),
    resend: v.optional(v.object({ apiKey: v.optional(encryptedSecret) })),
    lastTest: v.optional(
      v.object({ at: v.number(), ok: v.boolean(), error: v.optional(v.string()) }),
    ),
    createdBy: v.id("users"),
    activatedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  emailOutbox: defineTable({
    to: v.string(),
    template: v.string(), // key of the template registry
    data: v.any(), // validated per template by zod at enqueue
    category: v.union(
      v.literal("security"),
      v.literal("transactional"),
      v.literal("digest"),
      v.literal("product"),
    ),
    status: v.union(
      v.literal("queued"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("suppressed"),
      v.literal("cancelled"),
    ),
    attempts: v.number(),
    lastError: v.optional(v.string()),
    provider: v.optional(v.string()),
    providerMessageId: v.optional(v.string()),
    idempotencyKey: v.string(),
    sentAt: v.optional(v.number()),
    rid: v.string(), // request id for log correlation
  })
    .index("by_idempotency", ["idempotencyKey"])
    .index("by_status", ["status"])
    .index("by_to", ["to"]),

  emailSuppressions: defineTable({
    email: v.string(),
    scope: v.union(
      v.literal("all_non_security"),
      v.literal("digest"),
      v.literal("comet_alerts"),
      v.literal("product"),
    ),
    reason: v.union(
      v.literal("unsubscribed"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("admin"),
    ),
  }).index("by_email", ["email"]),

  auditLog: defineTable({
    actorId: v.id("users"),
    action: v.string(), // e.g. "user.suspend", "email.config.activate"
    targetType: v.string(),
    targetId: v.string(),
    before: v.optional(v.any()), // secrets are NEVER stored here
    after: v.optional(v.any()),
    reason: v.optional(v.string()),
    rid: v.string(),
  })
    .index("by_actor", ["actorId"])
    .index("by_target", ["targetType", "targetId"]),

  systemEvents: defineTable({
    level: v.union(v.literal("warn"), v.literal("error")),
    source: v.string(), // "email.dispatch", "jobs.bloom", ...
    code: v.string(),
    message: v.string(),
    context: v.optional(v.any()), // redacted
    rid: v.optional(v.string()),
  }).index("by_source", ["source"]),

  jobRuns: defineTable({
    job: v.string(),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    ok: v.optional(v.boolean()),
    processed: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_job", ["job"]),

  dailyStats: defineTable({
    day: v.string(),
    signups: v.number(),
    worldsCreated: v.number(),
    comets: v.number(),
    activeUsers: v.number(),
    visits: v.number(),
    emailsSent: v.number(),
    emailsFailed: v.number(),
  }).index("by_day", ["day"]),

  // Mail sent to @e2e.worldling.test on non-production deployments, read by Playwright (ADR-016).
  e2eMailbox: defineTable({
    to: v.string(),
    template: v.string(),
    data: v.any(),
  }).index("by_to", ["to"]),

  // Ready for §14, unused in v1.0
  entitlements: defineTable({
    userId: v.id("users"),
    sku: v.string(),
    source: v.union(v.literal("purchase"), v.literal("subscription"), v.literal("grant")),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("revoked")),
    expiresAt: v.optional(v.number()),
    externalRef: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_external", ["externalRef"]),
});
