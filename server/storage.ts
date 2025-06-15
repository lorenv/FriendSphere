import { users, friends, relationships, activities, friendNotes, type User, type InsertUser, type RegisterUser, type Friend, type InsertFriend, type Relationship, type InsertRelationship, type Activity, type InsertActivity, type FriendNote, type InsertFriendNote } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

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
  
  // Friend Notes CRUD (user-specific)
  getFriendNotes(userId: number, friendId: number): Promise<FriendNote[]>;
  createFriendNote(userId: number, note: InsertFriendNote): Promise<FriendNote>;
  deleteFriendNote(userId: number, noteId: number): Promise<boolean>;
  
  // Stats (user-specific)
  getFriendStats(userId: number): Promise<{
    totalFriends: number;
    closeFriends: number;
    newConnections: number;
    categoryBreakdown: Record<string, number>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User authentication methods
  async createUser(userData: RegisterUser): Promise<User> {
    const { hashPassword, generateGravatarUrl } = await import('./auth');
    const passwordHash = await hashPassword(userData.password);
    const photo = generateGravatarUrl(userData.email);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        passwordHash,
        photo,
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const { comparePassword } = await import('./auth');
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await comparePassword(password, user.passwordHash);
    return isValid ? user : null;
  }

  // Friends CRUD (user-specific)
  async getFriend(userId: number, id: number): Promise<Friend | undefined> {
    const [friend] = await db.select().from(friends).where(and(eq(friends.id, id), eq(friends.userId, userId)));
    return friend || undefined;
  }

  async getAllFriends(userId: number): Promise<Friend[]> {
    return await db.select().from(friends).where(eq(friends.userId, userId));
  }

  async getFriendsByCategory(userId: number, category: string): Promise<Friend[]> {
    return await db.select().from(friends).where(and(eq(friends.userId, userId), eq(friends.relationshipLevel, category)));
  }

  async getFriendsByLocation(userId: number, location: string): Promise<Friend[]> {
    const allFriends = await this.getAllFriends(userId);
    return allFriends.filter(
      (friend) => friend.location?.toLowerCase().includes(location.toLowerCase())
    );
  }

  async createFriend(userId: number, insertFriend: InsertFriend): Promise<Friend> {
    const [friend] = await db
      .insert(friends)
      .values({
        ...insertFriend,
        userId
      })
      .returning();
    
    // Create activity for new friend
    await this.createActivity(userId, {
      friendId: friend.id,
      activityType: "added",
      description: `Added ${friend.firstName} ${friend.lastName || ''} to your friends`,
    });
    
    return friend;
  }

  async updateFriend(userId: number, id: number, updateData: Partial<InsertFriend>): Promise<Friend | undefined> {
    const [friend] = await db
      .update(friends)
      .set(updateData)
      .where(and(eq(friends.id, id), eq(friends.userId, userId)))
      .returning();
    
    if (friend) {
      // Create activity for update
      await this.createActivity(userId, {
        friendId: id,
        activityType: "updated",
        description: `Updated ${friend.firstName} ${friend.lastName || ''}'s information`,
      });
    }
    
    return friend || undefined;
  }

  async deleteFriend(userId: number, id: number): Promise<boolean> {
    const result = await db.delete(friends).where(and(eq(friends.id, id), eq(friends.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getRelationship(userId: number, id: number): Promise<Relationship | undefined> {
    const [relationship] = await db.select().from(relationships).where(and(eq(relationships.id, id), eq(relationships.userId, userId)));
    return relationship || undefined;
  }

  async getRelationshipsByFriend(userId: number, friendId: number): Promise<Relationship[]> {
    return await db.select().from(relationships).where(and(eq(relationships.userId, userId), eq(relationships.friendId, friendId)));
  }

  async createRelationship(userId: number, insertRelationship: InsertRelationship): Promise<Relationship> {
    const [relationship] = await db
      .insert(relationships)
      .values({
        ...insertRelationship,
        userId
      })
      .returning();
    return relationship;
  }

  async deleteRelationship(userId: number, id: number): Promise<boolean> {
    const result = await db.delete(relationships).where(and(eq(relationships.id, id), eq(relationships.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getActivity(userId: number, id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(and(eq(activities.id, id), eq(activities.userId, userId)));
    return activity || undefined;
  }

  async getRecentActivities(userId: number, limit: number = 10): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.timestamp)).limit(limit);
  }

  async getActivitiesByFriend(userId: number, friendId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(and(eq(activities.userId, userId), eq(activities.friendId, friendId))).orderBy(desc(activities.timestamp));
  }

  async createActivity(userId: number, insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values({
        ...insertActivity,
        userId
      })
      .returning();
    return activity;
  }

  // Friend Notes methods
  async getFriendNotes(userId: number, friendId: number): Promise<FriendNote[]> {
    return await db.select().from(friendNotes)
      .where(and(eq(friendNotes.userId, userId), eq(friendNotes.friendId, friendId)))
      .orderBy(desc(friendNotes.timestamp));
  }

  async createFriendNote(userId: number, insertNote: InsertFriendNote): Promise<FriendNote> {
    const [note] = await db
      .insert(friendNotes)
      .values({
        ...insertNote,
        userId
      })
      .returning();
    return note;
  }

  async deleteFriendNote(userId: number, noteId: number): Promise<boolean> {
    const result = await db.delete(friendNotes)
      .where(and(eq(friendNotes.id, noteId), eq(friendNotes.userId, userId)));
    return result.rowCount > 0;
  }

  async getFriendStats(userId: number): Promise<{
    totalFriends: number;
    closeFriends: number;
    newConnections: number;
    categoryBreakdown: Record<string, number>;
  }> {
    const allFriends = await this.getAllFriends(userId);
    
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