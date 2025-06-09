import { friends, relationships, activities, type Friend, type InsertFriend, type Relationship, type InsertRelationship, type Activity, type InsertActivity } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private friends: Map<number, Friend>;
  private relationships: Map<number, Relationship>;
  private activities: Map<number, Activity>;
  private currentFriendId: number;
  private currentRelationshipId: number;
  private currentActivityId: number;

  constructor() {
    this.friends = new Map();
    this.relationships = new Map();
    this.activities = new Map();
    this.currentFriendId = 1;
    this.currentRelationshipId = 1;
    this.currentActivityId = 1;
  }

  async getFriend(id: number): Promise<Friend | undefined> {
    return this.friends.get(id);
  }

  async getAllFriends(): Promise<Friend[]> {
    return Array.from(this.friends.values());
  }

  async getFriendsByCategory(category: string): Promise<Friend[]> {
    return Array.from(this.friends.values()).filter(
      (friend) => friend.category === category,
    );
  }

  async getFriendsByLocation(location: string): Promise<Friend[]> {
    return Array.from(this.friends.values()).filter(
      (friend) => friend.location?.toLowerCase().includes(location.toLowerCase()),
    );
  }

  async createFriend(insertFriend: InsertFriend): Promise<Friend> {
    const id = this.currentFriendId++;
    const friend: Friend = { 
      ...insertFriend, 
      id,
      lastInteraction: null,
    };
    this.friends.set(id, friend);
    
    // Create activity for new friend
    await this.createActivity({
      friendId: id,
      activityType: "added",
      description: `Added ${friend.name} to your friends`,
    });
    
    return friend;
  }

  async updateFriend(id: number, updateData: Partial<InsertFriend>): Promise<Friend | undefined> {
    const existing = this.friends.get(id);
    if (!existing) return undefined;
    
    const updated: Friend = { ...existing, ...updateData };
    this.friends.set(id, updated);
    
    // Create activity for update
    await this.createActivity({
      friendId: id,
      activityType: "updated",
      description: `Updated ${existing.name}'s information`,
    });
    
    return updated;
  }

  async deleteFriend(id: number): Promise<boolean> {
    const deleted = this.friends.delete(id);
    if (deleted) {
      // Clean up related relationships
      const relatedRelationships = Array.from(this.relationships.entries()).filter(
        ([, rel]) => rel.friendId === id || rel.relatedFriendId === id
      );
      relatedRelationships.forEach(([relId]) => this.relationships.delete(relId));
    }
    return deleted;
  }

  async getRelationship(id: number): Promise<Relationship | undefined> {
    return this.relationships.get(id);
  }

  async getRelationshipsByFriend(friendId: number): Promise<Relationship[]> {
    return Array.from(this.relationships.values()).filter(
      (rel) => rel.friendId === friendId || rel.relatedFriendId === friendId,
    );
  }

  async createRelationship(insertRelationship: InsertRelationship): Promise<Relationship> {
    const id = this.currentRelationshipId++;
    const relationship: Relationship = { ...insertRelationship, id };
    this.relationships.set(id, relationship);
    return relationship;
  }

  async deleteRelationship(id: number): Promise<boolean> {
    return this.relationships.delete(id);
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
    
    return activities;
  }

  async getActivitiesByFriend(friendId: number): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(
      (activity) => activity.friendId === friendId,
    );
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = { 
      ...insertActivity, 
      id,
      timestamp: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getFriendStats(): Promise<{
    totalFriends: number;
    closeFriends: number;
    newConnections: number;
    categoryBreakdown: Record<string, number>;
  }> {
    const allFriends = Array.from(this.friends.values());
    const totalFriends = allFriends.length;
    const closeFriends = allFriends.filter(f => f.category === 'close_friends').length;
    
    // New connections in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivities = Array.from(this.activities.values()).filter(
      activity => activity.activityType === 'added' && 
      activity.timestamp && activity.timestamp > thirtyDaysAgo
    );
    const newConnections = recentActivities.length;
    
    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    allFriends.forEach(friend => {
      categoryBreakdown[friend.category] = (categoryBreakdown[friend.category] || 0) + 1;
    });
    
    return {
      totalFriends,
      closeFriends,
      newConnections,
      categoryBreakdown,
    };
  }
}

export const storage = new MemStorage();
