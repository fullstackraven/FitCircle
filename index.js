var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertUserSchema: () => insertUserSchema,
  insertWorkoutLogSchema: () => insertWorkoutLogSchema,
  insertWorkoutSchema: () => insertWorkoutSchema,
  users: () => users,
  workoutLogs: () => workoutLogs,
  workouts: () => workouts
});
import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").references(() => workouts.id).notNull(),
  date: text("date").notNull(),
  // YYYY-MM-DD format
  count: integer("count").default(0).notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertWorkoutSchema = createInsertSchema(workouts).pick({
  name: true,
  color: true
});
var insertWorkoutLogSchema = createInsertSchema(workoutLogs).pick({
  workoutId: true,
  date: true,
  count: true
});

