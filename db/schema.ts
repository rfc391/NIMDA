import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("analyst"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("active"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const intelligence = pgTable("intelligence", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  classification: text("classification").notNull(),
  metadata: jsonb("metadata"),
  aiProcessed: jsonb("ai_processed"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const annotations = pgTable("annotations", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  intelligenceId: integer("intelligence_id").references(() => intelligence.id).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  startOffset: integer("start_offset").notNull(),
  endOffset: integer("end_offset").notNull(),
  parentId: integer("parent_id").references(() => annotations.id),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  intelligenceId: integer("intelligence_id").references(() => intelligence.id).notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type Intelligence = typeof intelligence.$inferSelect;
export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = typeof annotations.$inferInsert;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

export const insertAnnotationSchema = createInsertSchema(annotations);
export const insertFeedbackSchema = createInsertSchema(feedback);