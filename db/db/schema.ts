import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations, type InferModel } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("analyst"),
  email: text("email").unique().notNull(),
  lastLogin: timestamp("last_login"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("active"),
  createdBy: integer("created_by").references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const intelligence = pgTable("intelligence", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  classification: text("classification").notNull(),
  metadata: jsonb("metadata"),
  aiProcessed: jsonb("ai_processed"),
  status: text("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
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
  type: text("type").notNull().default("comment"),
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

// Define relations with proper type annotations
export const userRelations = relations(users, ({ many }) => ({
  createdIntelligence: many(intelligence, { relationName: "createdIntelligence" }),
  annotations: many(annotations),
  feedback: many(feedback),
  alerts: many(alerts),
}));

export const intelligenceRelations = relations(intelligence, ({ one, many }) => ({
  creator: one(users, {
    fields: [intelligence.createdBy],
    references: [users.id],
    relationName: "createdIntelligence",
  }),
  annotations: many(annotations),
  feedback: many(feedback),
}));

// Schema types and validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = InferModel<typeof users>;
export type InsertUser = InferModel<typeof users, "insert">;

export type Alert = InferModel<typeof alerts>;
export type InsertAlert = InferModel<typeof alerts, "insert">;

export type Intelligence = InferModel<typeof intelligence>;
export type InsertIntelligence = InferModel<typeof intelligence, "insert">;

export type Annotation = InferModel<typeof annotations>;
export type InsertAnnotation = InferModel<typeof annotations, "insert">;

export type Feedback = InferModel<typeof feedback>;
export type InsertFeedback = InferModel<typeof feedback, "insert">;

export const insertAnnotationSchema = createInsertSchema(annotations);
export const insertFeedbackSchema = createInsertSchema(feedback);