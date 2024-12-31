import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { alerts, intelligence, annotations, feedback } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { setupWebSocket } from "./websocket";
import { processIntelligence } from "./services/ai";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Intelligence routes
  app.get("/api/intelligence", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Get intelligence with average ratings
    const data = await db.query.intelligence.findMany({
      with: {
        feedback: true,
      },
      orderBy: desc(intelligence.createdAt),
    });

    // Calculate average ratings and total feedback count
    const processedData = data.map(intel => ({
      ...intel,
      averageRating: intel.feedback?.length 
        ? intel.feedback.reduce((sum, f) => sum + f.rating, 0) / intel.feedback.length 
        : null,
      feedbackCount: intel.feedback?.length || 0
    }));

    res.json(processedData);
  });

  app.post("/api/intelligence", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const { title, content, classification, metadata } = req.body;


  app.post("/api/intelligence/batch", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const { reports } = req.body;
    
    const processedReports = await Promise.all(
      reports.map(async (report) => {
        const aiProcessed = await processIntelligence({
          id: 0,
          ...report,
          createdBy: req.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        return {
          ...report,
          aiProcessed,
          createdBy: req.user.id,
        };
      })
    );

    const inserted = await db.insert(intelligence)
      .values(processedReports)
      .returning();
      
    res.json(inserted);
  });

    // Process with AI
    const aiProcessed = await processIntelligence({ 
      id: 0, // Temporary ID for processing
      title, 
      content, 
      classification,
      metadata: metadata || null,
      aiProcessed: null, 
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const [intel] = await db.insert(intelligence)
      .values({
        title,
        content,
        classification,
        metadata,
        aiProcessed,
        createdBy: req.user.id
      })
      .returning();
    res.json(intel);
  });

  // Feedback routes
  app.get("/api/intelligence/:id/feedback", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { id } = req.params;
    const data = await db
      .select()
      .from(feedback)
      .where(eq(feedback.intelligenceId, parseInt(id)))
      .orderBy(feedback.createdAt);

    res.json(data);
  });

  app.post("/api/intelligence/:id/feedback", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { id } = req.params;
    const { rating, comment } = req.body;

    // Check if user has already provided feedback
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
      return res.status(400).send("You have already provided feedback for this report");
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
  });

  // Annotations routes
  app.get("/api/intelligence/:id/annotations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { id } = req.params;
    const data = await db
      .select()
      .from(annotations)
      .where(eq(annotations.intelligenceId, parseInt(id)))
      .orderBy(annotations.createdAt);

    res.json(data);
  });

  app.post("/api/intelligence/:id/annotations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

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
  });

  // Alerts routes
  app.get("/api/alerts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const data = await db.select().from(alerts).orderBy(alerts.createdAt);
    res.json(data);
  });

  app.post("/api/alerts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const { title, description, priority } = req.body;
    const [alert] = await db.insert(alerts)
      .values({
        title,
        description,
        priority,
        createdBy: req.user.id
      })
      .returning();
    res.json(alert);
  });

  const httpServer = createServer(app);

  // Setup WebSocket after creating HTTP server
  setupWebSocket(httpServer, app);

  return httpServer;
}