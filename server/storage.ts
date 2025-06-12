import { friends, relationships, activities, type Friend, type InsertFriend, type Relationship, type InsertRelationship, type Activity, type InsertActivity } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Friends CRUD
  getFriend(id: number): Promise<Friend | undefined>;
  getAllFriends(): Promise<Friend[]>;
  getFriendsByCategory(category: string): Promise<Friend[]>;
  getFriendsByLocation(location: string): Promise<Friend[]>;
  createFriend(friend: InsertFriend): Promise<Friend>;
  updateFriend(id: number, friend: Partial<InsertFriend>): Promise<Friend | undefined>;
  deleteFriend(id: number): Promise<boolean>;
  
  // Relationships CRUD
  getRelationship(id: number): Promise<Relationship | undefined>;
  getRelationshipsByFriend(friendId: number): Promise<Relationship[]>;
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;
  deleteRelationship(id: number): Promise<boolean>;
  
  // Activities CRUD
  getActivity(id: number): Promise<Activity | undefined>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
  getActivitiesByFriend(friendId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Stats
  getFriendStats(): Promise<{
    totalFriends: number;
    closeFriends: number;
    newConnections: number;
    categoryBreakdown: Record<string, number>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Use a default userId of 1 for backwards compatibility
  private defaultUserId = 1;

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
      .values({
        ...insertFriend,
        userId: this.defaultUserId
      })
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
    const result = await db.delete(friends).where(eq(friends.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
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
      .values({
        ...insertRelationship,
        userId: this.defaultUserId
      })
      .returning();
    return relationship;
  }

  async deleteRelationship(id: number): Promise<boolean> {
    const result = await db.delete(relationships).where(eq(relationships.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.timestamp)).limit(limit);
  }

  async getActivitiesByFriend(friendId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.friendId, friendId)).orderBy(desc(activities.timestamp));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values({
        ...insertActivity,
        userId: this.defaultUserId
      })
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
    const closeFriends = allFriends.filter(f => f.relationshipLevel === "close").length;
    const newConnections = allFriends.filter(f => f.isNewFriend).length;
    
    const categoryBreakdown: Record<string, number> = {};
    allFriends.forEach(friend => {
      const level = friend.relationshipLevel || "acquaintance";
      categoryBreakdown[level] = (categoryBreakdown[level] || 0) + 1;
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