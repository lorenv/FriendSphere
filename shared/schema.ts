import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for email/password auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  photo: text("photo"), // Gravatar URL or uploaded photo
  phone: text("phone"),
  location: text("location"),
  bio: text("bio"),
  isPublic: boolean("is_public").default(false), // Whether profile is discoverable by other users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  photo: text("photo"),
  location: text("location"), // City, State format
  neighborhood: text("neighborhood"), // Specific neighborhood within location
  relationshipLevel: text("relationship_level").default("acquaintance").notNull(), // acquaintance, friend, close
  isNewFriend: boolean("is_new_friend").default(true), // Toggle to mark as new connection
  
  // Simplified interests - just 3 key interests as text
  interest1: text("interest1"),
  interest2: text("interest2"),
  interest3: text("interest3"),
  
  // Hangout preferences
  favoriteHangoutSpots: text("favorite_hangout_spots"), // Where they like to go
  bestTimeToReach: text("best_time_to_reach"), // When they're usually free
  preferredCommunication: text("preferred_communication"), // Text, call, email, etc.
  activityPreferences: text("activity_preferences"), // What they enjoy doing
  lastHangout: text("last_hangout"), // When you last hung out
  nextPlannedActivity: text("next_planned_activity"), // Something you're planning together
  availabilityNotes: text("availability_notes"), // "Usually free weekends", etc.
  groupVsOneOnOne: text("group_vs_one_on_one"), // Group hangouts vs one-on-one preference
  
  // Family info with toggles
  hasPartner: boolean("has_partner").default(false),
  partnerName: text("partner_name"), // Name of partner/spouse
  hasKids: boolean("has_kids").default(false),
  childrenNames: text("children_names").array().default([]), // Array of children names
  
  // Basic info
  introducedBy: integer("introduced_by"), // ID of friend who introduced them
  howWeMet: text("how_we_met"), // Story of how you met
  phone: text("phone"), // Phone number
  email: text("email"), // Email address
  birthday: text("birthday"), // Birthday in YYYY-MM-DD format
  contactInfo: text("contact_info"), // JSON string for additional social media
  lastInteraction: timestamp("last_interaction"),
});

// Individual notes table for flexible note-taking
export const friendNotes = pgTable("friend_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  relatedFriendId: integer("related_friend_id").notNull(),
  relationshipType: text("relationship_type").notNull(), // introduced_by, partner, friend_of, etc.
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  activityType: text("activity_type").notNull(), // updated, moved, added, etc.
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Contact sharing table for users to share their info with each other
export const contactShares = pgTable("contact_shares", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  shareData: text("share_data").notNull(), // JSON with contact info to share
  message: text("message"), // Optional message with the contact share
  timestamp: timestamp("timestamp").defaultNow(),
  isAccepted: boolean("is_accepted").default(false),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = insertUserSchema.omit({
  passwordHash: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Update existing schemas to include userId
export const insertFriendSchema = createInsertSchema(friends).omit({
  id: true,
  userId: true,
  lastInteraction: true,
});

export const insertRelationshipSchema = createInsertSchema(relationships).omit({
  id: true,
  userId: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  userId: true,
  timestamp: true,
});

export const insertContactShareSchema = createInsertSchema(contactShares).omit({
  id: true,
  timestamp: true,
  isAccepted: true,
});

export const insertFriendNoteSchema = createInsertSchema(friendNotes).omit({
  id: true,
  userId: true,
  timestamp: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationships.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertContactShare = z.infer<typeof insertContactShareSchema>;
export type ContactShare = typeof contactShares.$inferSelect;
export type InsertFriendNote = z.infer<typeof insertFriendNoteSchema>;
export type FriendNote = typeof friendNotes.$inferSelect;
