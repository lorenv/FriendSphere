import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  photo: text("photo"),
  location: text("location"), // City, State format
  category: text("category").notNull(), // close_friends, friends, work_friends, new_friends, acquaintances, etc.
  interests: text("interests").array().default([]), // Array of interests
  lifestyle: text("lifestyle"),
  hasKids: boolean("has_kids").default(false),
  partner: text("partner"), // Name of partner/spouse
  introducedBy: integer("introduced_by"), // ID of friend who introduced them
  howWeMet: text("how_we_met"), // Story of how you met
  notes: text("notes"),
  contactInfo: text("contact_info"), // JSON string for phone, email, social media
  lastInteraction: timestamp("last_interaction"),
});

export const relationships = pgTable("relationships", {
  id: serial("id").primaryKey(),
  friendId: integer("friend_id").notNull(),
  relatedFriendId: integer("related_friend_id").notNull(),
  relationshipType: text("relationship_type").notNull(), // introduced_by, partner, friend_of, etc.
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  friendId: integer("friend_id").notNull(),
  activityType: text("activity_type").notNull(), // updated, moved, added, etc.
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertFriendSchema = createInsertSchema(friends).omit({
  id: true,
  lastInteraction: true,
});

export const insertRelationshipSchema = createInsertSchema(relationships).omit({
  id: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Relationship = typeof relationships.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Remove the users table from the original schema since we're not implementing authentication
