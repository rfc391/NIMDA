import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { alerts, intelligence, annotations, feedback, users, type User } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { setupWebSocket } from "./websocket";
import { processIntelligence } from "./services/ai";

// Authentication middleware with proper types
interface AuthenticatedRequest extends Request {
  user?: User;
  isAuthenticated(): this is { user: User };
}

const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Intelligence routes
  app.get("/api/intelligence", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await db.query.intelligence.findMany({
        with: { feedback: true },
        orderBy: desc(intelligence.createdAt),
      });

      const processedData = data.map(intel => ({
        ...intel,
        averageRating: intel.feedback?.length 
          ? intel.feedback.reduce((sum, f) => sum + f.rating, 0) / intel.feedback.length 
          : null,
        feedbackCount: intel.feedback?.length || 0
      }));

      res.json(processedData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch intelligence data" });
    }
  });

  app.post("/api/intelligence", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, content, classification, metadata } = req.body;

      const initialData = {
        id: 0,
        title,
        content,
        classification,
        metadata: metadata || null,
        aiProcessed: null,
        status: "draft" as const,
        createdBy: req.user.id,
        lastModifiedBy: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const aiProcessed = await processIntelligence(initialData);

      const [intel] = await db.insert(intelligence)
        .values({
          title,
          content,
          classification,
          metadata,
          aiProcessed,
          status: "draft",
          createdBy: req.user.id,
          lastModifiedBy: req.user.id
        })
        .returning();
      res.json(intel);
    } catch (error) {
      res.status(500).json({ error: "Failed to create intelligence" });
    }
  });

  // Feedback routes
  app.get("/api/intelligence/:id/feedback", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = await db
        .select()
        .from(feedback)
        .where(eq(feedback.intelligenceId, parseInt(id)))
        .orderBy(feedback.createdAt);

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  app.post("/api/intelligence/:id/feedback", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      const [existingFeedback] = await db
        .select()
        .from(feedback)
        .where(
          and(
            eq(feedback.intelligenceId, parseInt(id)),
            eq(feedback.createdBy, req.user.id)
          )
        )
        .limit(1);

      if (existingFeedback) {
        return res.status(400).json({ error: "Feedback already provided" });
      }

      const [newFeedback] = await db
        .insert(feedback)
        .values({
          intelligenceId: parseInt(id),
          createdBy: req.user.id,
          rating,
          comment,
        })
        .returning();

      res.json(newFeedback);
    } catch (error) {
      res.status(500).json({ error: "Failed to create feedback" });
    }
  });

  // Annotations routes
  app.get("/api/intelligence/:id/annotations", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = await db
        .select()
        .from(annotations)
        .where(eq(annotations.intelligenceId, parseInt(id)))
        .orderBy(annotations.createdAt);

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch annotations" });
    }
  });

  app.post("/api/intelligence/:id/annotations", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { content, startOffset, endOffset, parentId } = req.body;

      const [annotation] = await db
        .insert(annotations)
        .values({
          content,
          intelligenceId: parseInt(id),
          createdBy: req.user.id,
          startOffset,
          endOffset,
          parentId: parentId || null,
        })
        .returning();

      res.json(annotation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create annotation" });
    }
  });

  // Alerts routes
  app.get("/api/alerts", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await db.select().from(alerts).orderBy(alerts.createdAt);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, description, priority } = req.body;

      const [alert] = await db.insert(alerts)
        .values({
          title,
          description,
          priority,
          createdBy: req.user.id,
          status: "active",
        })
        .returning();
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  const httpServer = createServer(app);
  setupWebSocket(httpServer, app);

  return httpServer;
}