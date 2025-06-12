import {
  users,
  friends,
  relationships,
  activities,
  contactShares,
  type User,
  type InsertUser,
  type RegisterUser,
  type Friend,
  type InsertFriend,
  type Relationship,
  type InsertRelationship,
  type Activity,
  type InsertActivity,
  type ContactShare,
  type InsertContactShare,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User authentication
  createUser(userData: RegisterUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  
  // Friends CRUD (user-specific)
  getFriend(userId: number, id: number): Promise<Friend | undefined>;
  getAllFriends(userId: number): Promise<Friend[]>;
  getFriendsByCategory(userId: number, category: string): Promise<Friend[]>;
  getFriendsByLocation(userId: number, location: string): Promise<Friend[]>;
  createFriend(userId: number, friend: InsertFriend): Promise<Friend>;
  updateFriend(userId: number, id: number, friend: Partial<InsertFriend>): Promise<Friend | undefined>;
  deleteFriend(userId: number, id: number): Promise<boolean>;
  
  // Relationships CRUD (user-specific)
  getRelationship(userId: number, id: number): Promise<Relationship | undefined>;
  getRelationshipsByFriend(userId: number, friendId: number): Promise<Relationship[]>;
  createRelationship(userId: number, relationship: InsertRelationship): Promise<Relationship>;
  deleteRelationship(userId: number, id: number): Promise<boolean>;
  
  // Activities CRUD (user-specific)
  getActivity(userId: number, id: number): Promise<Activity | undefined>;
  getRecentActivities(userId: number, limit?: number): Promise<Activity[]>;
  getActivitiesByFriend(userId: number, friendId: number): Promise<Activity[]>;
  createActivity(userId: number, activity: InsertActivity): Promise<Activity>;
  
  // Contact sharing
  createContactShare(share: InsertContactShare): Promise<ContactShare>;
  getContactSharesReceived(userId: number): Promise<ContactShare[]>;
  getContactSharesSent(userId: number): Promise<ContactShare[]>;
  acceptContactShare(shareId: number): Promise<boolean>;
  
  // Stats (user-specific)
  getFriendStats(userId: number): Promise<{
    totalFriends: number;
    closeFriends: number;
    newConnections: number;
    categoryBreakdown: Record<string, number>;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getFriend(id: number): Promise<Friend | undefined> {
    const [friend] = await db.select().from(friends).where(eq(friends.id, id));
    return friend || undefined;
  }

  async getAllFriends(): Promise<Friend[]> {
    return await db.select().from(friends);
  }

  async getFriendsByCategory(category: string): Promise<Friend[]> {
    return await db.select().from(friends).where(eq(friends.relationshipLevel, category));
  }

  async getFriendsByLocation(location: string): Promise<Friend[]> {
    const allFriends = await db.select().from(friends);
    return allFriends.filter(
      (friend) => friend.location?.toLowerCase().includes(location.toLowerCase())
    );
  }

  async createFriend(insertFriend: InsertFriend): Promise<Friend> {
    const [friend] = await db
      .insert(friends)
      .values(insertFriend)
      .returning();
    
    // Create activity for new friend
    await this.createActivity({
      friendId: friend.id,
      activityType: "added",
      description: `Added ${friend.firstName} ${friend.lastName || ''} to your friends`,
    });
    
    return friend;
  }

  async updateFriend(id: number, updateData: Partial<InsertFriend>): Promise<Friend | undefined> {
    const [friend] = await db
      .update(friends)
      .set(updateData)
      .where(eq(friends.id, id))
      .returning();
    
    if (friend) {
      // Create activity for update
      await this.createActivity({
        friendId: id,
        activityType: "updated",
        description: `Updated ${friend.firstName} ${friend.lastName || ''}'s information`,
      });
    }
    
    return friend || undefined;
  }

  async deleteFriend(id: number): Promise<boolean> {
    // Clean up related relationships first
    await db.delete(relationships).where(eq(relationships.friendId, id));
    await db.delete(relationships).where(eq(relationships.relatedFriendId, id));
    
    const [deleted] = await db.delete(friends).where(eq(friends.id, id)).returning();
    return !!deleted;
  }

  async getRelationship(id: number): Promise<Relationship | undefined> {
    const [relationship] = await db.select().from(relationships).where(eq(relationships.id, id));
    return relationship || undefined;
  }

  async getRelationshipsByFriend(friendId: number): Promise<Relationship[]> {
    return await db.select().from(relationships).where(eq(relationships.friendId, friendId));
  }

  async createRelationship(insertRelationship: InsertRelationship): Promise<Relationship> {
    const [relationship] = await db
      .insert(relationships)
      .values(insertRelationship)
      .returning();
    return relationship;
  }

  async deleteRelationship(id: number): Promise<boolean> {
    const [deleted] = await db.delete(relationships).where(eq(relationships.id, id)).returning();
    return !!deleted;
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.timestamp)).limit(limit);
  }

  async getActivitiesByFriend(friendId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.friendId, friendId));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getFriendStats(): Promise<{
    totalFriends: number;
    closeFriends: number;
    newConnections: number;
    categoryBreakdown: Record<string, number>;
  }> {
    const allFriends = await this.getAllFriends();
    const totalFriends = allFriends.length;
    const closeFriends = allFriends.filter(f => f.relationshipLevel === 'close').length;
    
    // New connections in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivities = await db.select().from(activities)
      .where(eq(activities.activityType, 'added'));
    const newConnections = recentActivities.filter(
      activity => activity.timestamp && activity.timestamp > thirtyDaysAgo
    ).length;
    
    // Relationship level breakdown
    const categoryBreakdown: Record<string, number> = {};
    allFriends.forEach(friend => {
      categoryBreakdown[friend.relationshipLevel] = (categoryBreakdown[friend.relationshipLevel] || 0) + 1;
    });
    
    return {
      totalFriends,
      closeFriends,
      newConnections,
      categoryBreakdown,
    };
  }
}

export const storage = new DatabaseStorage();
