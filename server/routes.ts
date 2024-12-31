import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { alerts, intelligence, annotations } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { setupWebSocket } from "./websocket";
import { processIntelligence } from "./services/ai";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Intelligence routes
  app.get("/api/intelligence", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const data = await db.select().from(intelligence).orderBy(intelligence.createdAt);
    res.json(data);
  });

  app.post("/api/intelligence", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    const { title, content, classification, metadata } = req.body;

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