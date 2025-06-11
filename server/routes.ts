import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFriendSchema, insertRelationshipSchema, insertActivitySchema } from "@shared/schema";
import { z } from "zod";


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

  app.patch("/api/friends/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertFriendSchema.partial().parse(req.body);
      console.log("PATCH request received for friend", id, "with photo:", updateData.photo?.substring(0, 50) + "...");
      const friend = await storage.updateFriend(id, updateData);
      
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
      
      console.log("Friend updated successfully, photo:", friend.photo?.substring(0, 50) + "...");
      res.json(friend);
    } catch (error) {
      console.error("PATCH error:", error);
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

  // Instagram profile photo utility - generates profile photo URL patterns
  app.post("/api/instagram/profile-photo", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }
      
      // Clean username (remove @ if present)
      const cleanUsername = username.replace(/^@/, '');
      
      // Validate username format
      if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
        return res.status(400).json({ error: "Invalid username format" });
      }
      
      // Since Instagram actively blocks scraping, we'll generate likely profile photo URLs
      // These are based on Instagram's CDN patterns for profile pictures
      const possibleUrls = [
        `https://instagram.com/${cleanUsername}`, // Direct profile link
        `https://www.instagram.com/${cleanUsername}/`, // Web profile
      ];
      
      // For development/testing, we'll return a success response with the username
      // In practice, users would manually save and upload profile photos
      console.log(`Profile photo request for: ${cleanUsername}`);
      
      // Instead of scraping (which Instagram blocks), provide guidance
      return res.json({
        success: true,
        username: cleanUsername,
        profilePhotoUrl: '', // Empty since we can't reliably scrape
        profileUrl: `https://www.instagram.com/${cleanUsername}/`,
        message: "Instagram blocks automated profile photo access. Please save the profile photo manually.",
        instructions: [
          `1. Visit https://www.instagram.com/${cleanUsername}/`,
          "2. Right-click on the profile photo",
          "3. Select 'Save image as...'",
          "4. Upload the saved image when adding the friend"
        ]
      });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Server error';
      console.error('Instagram profile photo error:', errorMessage);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  // Places search route
  app.post("/api/places/search", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || query.length < 2) {
        return res.json({ suggestions: [] });
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Maps API key not configured" });
      }

      // Use Google Places API Autocomplete with US restriction and broader search
      const params = new URLSearchParams({
        input: query,
        key: apiKey,
        components: 'country:us', // Restrict to US only
        types: 'establishment|geocode', // Include establishments and geographic areas
        language: 'en'
      });

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error("Google Places API error:", data);
        return res.status(500).json({ error: "Places search failed" });
      }

      const suggestions = data.predictions?.map((prediction: any) => {
        // Determine the type based on the place types
        let type = "locality";
        if (prediction.types.includes("neighborhood") || 
            prediction.types.includes("sublocality") ||
            prediction.types.includes("sublocality_level_1") ||
            prediction.types.includes("sublocality_level_2")) {
          type = "neighborhood";
        } else if (prediction.types.includes("administrative_area_level_3")) {
          type = "administrative_area_level_3";
        }

        return {
          id: prediction.place_id,
          name: prediction.structured_formatting.main_text,
          type,
          fullLocation: prediction.description,
          placeId: prediction.place_id
        };
      }) || [];

      res.json({ suggestions });
    } catch (error) {
      console.error("Places search error:", error);
      res.status(500).json({ error: "Failed to search places" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
