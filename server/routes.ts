import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFriendSchema, insertRelationshipSchema, insertActivitySchema, registerUserSchema, loginUserSchema } from "@shared/schema";
import { authenticateToken, generateToken, type AuthenticatedRequest } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const token = generateToken(user.id);
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          photo: user.photo 
        }, 
        token 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const loginData = loginUserSchema.parse(req.body);
      const user = await storage.verifyPassword(loginData.email, loginData.password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const token = generateToken(user.id);
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          photo: user.photo 
        }, 
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/user", authenticateToken, async (req: AuthenticatedRequest, res) => {
    res.json(req.user);
  });

  // Friends routes (protected)
  app.get("/api/friends", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { category, location } = req.query;
      const userId = req.userId!;
      
      let friends;
      if (category && typeof category === 'string') {
        friends = await storage.getFriendsByCategory(userId, category);
      } else if (location && typeof location === 'string') {
        friends = await storage.getFriendsByLocation(userId, location);
      } else {
        friends = await storage.getAllFriends(userId);
      }
      
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get("/api/friends/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const friend = await storage.getFriend(req.userId!, id);
      
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
      
      res.json(friend);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend" });
    }
  });

  app.post("/api/friends", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const friendData = insertFriendSchema.parse(req.body);
      const friend = await storage.createFriend(req.userId!, friendData);
      res.status(201).json(friend);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Friend validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Invalid friend data", 
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      console.error("Failed to create friend:", error);
      res.status(500).json({ message: "Failed to create friend" });
    }
  });

  app.put("/api/friends/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertFriendSchema.partial().parse(req.body);
      const friend = await storage.updateFriend(req.userId!, id, updateData);
      
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

  app.patch("/api/friends/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertFriendSchema.partial().parse(req.body);
      console.log("PATCH request received for friend", id, "with photo:", updateData.photo?.substring(0, 50) + "...");
      const friend = await storage.updateFriend(req.userId!, id, updateData);
      
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

  app.delete("/api/friends/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFriend(req.userId!, id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Friend not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete friend" });
    }
  });

  // Relationships routes
  app.get("/api/friends/:id/relationships", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const friendId = parseInt(req.params.id);
      const relationships = await storage.getRelationshipsByFriend(req.userId!, friendId);
      res.json(relationships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });

  app.post("/api/relationships", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const relationshipData = insertRelationshipSchema.parse(req.body);
      const relationship = await storage.createRelationship(req.userId!, relationshipData);
      res.status(201).json(relationship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid relationship data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create relationship" });
    }
  });

  // Activities routes
  app.get("/api/activities", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(req.userId!, limit);
      
      // Enrich activities with friend data
      const enrichedActivities = await Promise.all(
        activities.map(async (activity) => {
          const friend = await storage.getFriend(req.userId!, activity.friendId);
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

  app.get("/api/friends/:id/activities", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const friendId = parseInt(req.params.id);
      const activities = await storage.getActivitiesByFriend(req.userId!, friendId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend activities" });
    }
  });

  // Stats route
  app.get("/api/stats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getFriendStats(req.userId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });


  // Gravatar photo lookup
  app.post("/api/gravatar/lookup", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Create MD5 hash of email for Gravatar
      const crypto = await import('crypto');
      const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
      const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=200&d=404`;
      
      // Check if Gravatar exists by making a request
      try {
        const response = await fetch(gravatarUrl);
        if (response.ok) {
          return res.json({
            success: true,
            email,
            photoUrl: `https://www.gravatar.com/avatar/${hash}?s=200`,
            highResUrl: `https://www.gravatar.com/avatar/${hash}?s=400`
          });
        } else {
          return res.status(404).json({
            success: false,
            email,
            message: "No Gravatar found for this email address"
          });
        }
      } catch (fetchError) {
        return res.status(404).json({
          success: false,
          email,
          message: "Unable to check Gravatar availability"
        });
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Server error';
      console.error('Gravatar lookup error:', errorMessage);
      res.status(500).json({ error: "Failed to lookup Gravatar" });
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
