import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { alerts, intelligence } from "@db/schema";
import { eq } from "drizzle-orm";

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
    const [intel] = await db.insert(intelligence)
      .values({
        title,
        content,
        classification,
        metadata,
        createdBy: req.user.id
      })
      .returning();
    res.json(intel);
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
  return httpServer;
}
