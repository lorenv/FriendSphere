import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFriendSchema, insertRelationshipSchema, insertActivitySchema } from "@shared/schema";
import { z } from "zod";
import { getInstagramAuthUrl, handleInstagramCallback, getInstagramProfile, getInstagramMedia, disconnectInstagram } from "./instagram";

export async function registerRoutes(app: Express): Promise<Server> {
  // Friends routes
  app.get("/api/friends", async (req, res) => {
    try {
      const { category, location } = req.query;
      
      let friends;
      if (category && typeof category === 'string') {
        friends = await storage.getFriendsByCategory(category);
      } else if (location && typeof location === 'string') {
        friends = await storage.getFriendsByLocation(location);
      } else {
        friends = await storage.getAllFriends();
      }
      
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get("/api/friends/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const friend = await storage.getFriend(id);
      
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
      
      res.json(friend);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend" });
    }
  });

  app.post("/api/friends", async (req, res) => {
    try {
      const friendData = insertFriendSchema.parse(req.body);
      const friend = await storage.createFriend(friendData);
      res.status(201).json(friend);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid friend data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create friend" });
    }
  });

  app.put("/api/friends/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertFriendSchema.partial().parse(req.body);
      const friend = await storage.updateFriend(id, updateData);
      
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
      
      res.json(friend);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid friend data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update friend" });
    }
  });

  app.delete("/api/friends/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFriend(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Friend not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete friend" });
    }
  });

  // Relationships routes
  app.get("/api/friends/:id/relationships", async (req, res) => {
    try {
      const friendId = parseInt(req.params.id);
      const relationships = await storage.getRelationshipsByFriend(friendId);
      res.json(relationships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });

  app.post("/api/relationships", async (req, res) => {
    try {
      const relationshipData = insertRelationshipSchema.parse(req.body);
      const relationship = await storage.createRelationship(relationshipData);
      res.status(201).json(relationship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid relationship data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create relationship" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(limit);
      
      // Enrich activities with friend data
      const enrichedActivities = await Promise.all(
        activities.map(async (activity) => {
          const friend = await storage.getFriend(activity.friendId);
          return {
            ...activity,
            friend,
          };
        })
      );
      
      res.json(enrichedActivities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/friends/:id/activities", async (req, res) => {
    try {
      const friendId = parseInt(req.params.id);
      const activities = await storage.getActivitiesByFriend(friendId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend activities" });
    }
  });

  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getFriendStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Instagram integration routes
  app.get("/api/instagram/auth-url", getInstagramAuthUrl);
  app.get("/api/instagram/callback", handleInstagramCallback);
  app.get("/api/instagram/profile", getInstagramProfile);
  app.get("/api/instagram/media", getInstagramMedia);
  app.post("/api/instagram/disconnect", disconnectInstagram);

  const httpServer = createServer(app);
  return httpServer;
}
