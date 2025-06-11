import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { 
  insertFriendSchema, 
  insertRelationshipSchema, 
  insertActivitySchema,
  registerUserSchema,
  loginUserSchema,
  insertContactShareSchema,
  type User
} from "@shared/schema";
import { z } from "zod";

// Extend session to include user
declare module "express-session" {
  interface SessionData {
    userId?: number;
    user?: User;
  }
}

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      // Check for Gravatar photo if email provided and no photo
      if (!userData.photo && userData.email) {
        try {
          const gravatarResponse = await fetch('/api/gravatar/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userData.email })
          });
          const gravatarData = await gravatarResponse.json();
          if (gravatarData.success) {
            userData.photo = gravatarData.highResUrl;
          }
        } catch (error) {
          // Silently ignore Gravatar errors
        }
      }
      
      const user = await storage.createUser(userData);
      
      // Log user in after registration
      req.session.userId = user.id;
      req.session.user = user;
      
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          photo: user.photo,
          location: user.location,
          bio: user.bio,
          isPublic: user.isPublic
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      
      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      req.session.userId = user.id;
      req.session.user = user;
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          photo: user.photo,
          location: user.location,
          bio: user.bio,
          isPublic: user.isPublic
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        photo: user.photo,
        location: user.location,
        bio: user.bio,
        isPublic: user.isPublic
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User-specific Friends routes
  app.get("/api/friends", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { category, location } = req.query;
      
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

  app.get("/api/friends/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const id = parseInt(req.params.id);
      const friend = await storage.getFriend(userId, id);
      
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
      
      res.json(friend);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch friend" });
    }
  });

  app.post("/api/friends", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const friendData = insertFriendSchema.parse(req.body);
      const friend = await storage.createFriend(userId, friendData);
      res.status(201).json(friend);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create friend" });
    }
  });

  app.patch("/api/friends/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const id = parseInt(req.params.id);
      const updateData = insertFriendSchema.partial().parse(req.body);
      
      const friend = await storage.updateFriend(userId, id, updateData);
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
      
      res.json(friend);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update friend" });
    }
  });

  app.delete("/api/friends/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const id = parseInt(req.params.id);
      
      const success = await storage.deleteFriend(userId, id);
      if (!success) {
        return res.status(404).json({ message: "Friend not found" });
      }
      
      res.json({ message: "Friend deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete friend" });
    }
  });

  // User-specific Activities routes
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // User-specific Stats route
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const stats = await storage.getFriendStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Contact sharing routes
  app.post("/api/contact-shares", requireAuth, async (req, res) => {
    try {
      const shareData = insertContactShareSchema.parse(req.body);
      const contactShare = await storage.createContactShare(shareData);
      res.status(201).json(contactShare);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contact share" });
    }
  });

  app.get("/api/contact-shares/received", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const shares = await storage.getContactSharesReceived(userId);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch received contact shares" });
    }
  });

  app.get("/api/contact-shares/sent", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const shares = await storage.getContactSharesSent(userId);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sent contact shares" });
    }
  });

  app.patch("/api/contact-shares/:id/accept", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.acceptContactShare(id);
      
      if (!success) {
        return res.status(404).json({ message: "Contact share not found" });
      }
      
      res.json({ message: "Contact share accepted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to accept contact share" });
    }
  });

  // Gravatar lookup route (unchanged)
  app.post("/api/gravatar/lookup", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      const crypto = await import('crypto');
      const emailHash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
      
      // Check if Gravatar exists
      const checkUrl = `https://www.gravatar.com/avatar/${emailHash}?d=404&s=200`;
      const response = await fetch(checkUrl);
      
      if (response.status === 404) {
        return res.status(404).json({ 
          success: false, 
          email,
          message: "No Gravatar found for this email address" 
        });
      }
      
      // Return different resolution URLs
      const baseUrl = `https://www.gravatar.com/avatar/${emailHash}`;
      
      res.json({
        success: true,
        email,
        hash: emailHash,
        thumbnailUrl: `${baseUrl}?s=80&d=identicon`,
        standardUrl: `${baseUrl}?s=200&d=identicon`,
        highResUrl: `${baseUrl}?s=400&d=identicon`,
        message: "Gravatar found successfully"
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error checking Gravatar" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}