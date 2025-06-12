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
  userId: varchar("user_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  photo: text("photo"),
  location: text("location"), // City, State format
  neighborhood: text("neighborhood"), // Specific neighborhood within location
  relationshipLevel: text("relationship_level").default("acquaintance").notNull(), // acquaintance, friend, close, work
  isNewFriend: boolean("is_new_friend").default(true), // Toggle to mark as new connection
  interests: text("interests").array().default([]), // Array of interests
  lifestyle: text("lifestyle"),
  hasKids: boolean("has_kids").default(false),
  partner: text("partner"), // Name of partner/spouse
  introducedBy: integer("introduced_by"), // ID of friend who introduced them
  howWeMet: text("how_we_met"), // Story of how you met
  notes: text("notes"),
  phone: text("phone"), // Phone number
  email: text("email"), // Email address
  birthday: text("birthday"), // Birthday in YYYY-MM-DD format
  contactInfo: text("contact_info"), // JSON string for additional social media
  lastInteraction: timestamp("last_interaction"),
});

export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  relatedFriendId: integer("related_friend_id").notNull(),
  relationshipType: text("relationship_type").notNull(), // introduced_by, partner, friend_of, etc.
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  activityType: text("activity_type").notNull(), // updated, moved, added, etc.
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Contact sharing table for users to share their info with each other
export const contactShares = pgTable("contact_shares", {
  id: serial("id").primaryKey(),
  fromUserId: varchar("from_user_id").notNull(),
  toUserId: varchar("to_user_id").notNull(),
  shareData: text("share_data").notNull(), // JSON with contact info to share
  message: text("message"), // Optional message with the contact share
  timestamp: timestamp("timestamp").defaultNow(),
  isAccepted: boolean("is_accepted").default(false),
});

// User schemas for Replit Auth
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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

// Types
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
