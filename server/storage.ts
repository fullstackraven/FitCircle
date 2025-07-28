import { users, workouts, workoutLogs, supplements, supplementLogs, type User, type InsertUser, type Workout, type WorkoutLog, type InsertWorkout, type InsertWorkoutLog, type Supplement, type SupplementLog, type InsertSupplement, type InsertSupplementLog } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workout management
  getWorkouts(): Promise<Workout[]>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  
  // Workout log management
  getWorkoutLog(workoutId: number, date: string): Promise<WorkoutLog | undefined>;
  createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;
  updateWorkoutLog(workoutId: number, date: string, count: number): Promise<WorkoutLog>;
  getWorkoutLogsByDateRange(startDate: string, endDate: string): Promise<WorkoutLog[]>;
  
  // Supplement management
  getSupplements(): Promise<Supplement[]>;
  createSupplement(supplement: InsertSupplement): Promise<Supplement>;
  
  // Supplement log management
  getSupplementLog(supplementId: number, date: string): Promise<SupplementLog | undefined>;
  createSupplementLog(log: InsertSupplementLog): Promise<SupplementLog>;
  updateSupplementLog(supplementId: number, date: string, taken: boolean): Promise<SupplementLog>;
  getSupplementLogsByDateRange(startDate: string, endDate: string): Promise<SupplementLog[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getWorkouts(): Promise<Workout[]> {
    return await db.select().from(workouts);
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db
      .insert(workouts)
      .values(workout)
      .returning();
    return newWorkout;
  }

  async getWorkoutLog(workoutId: number, date: string): Promise<WorkoutLog | undefined> {
    const [log] = await db
      .select()
      .from(workoutLogs)
      .where(and(eq(workoutLogs.workoutId, workoutId), eq(workoutLogs.date, date)));
    return log || undefined;
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const [newLog] = await db
      .insert(workoutLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async updateWorkoutLog(workoutId: number, date: string, count: number): Promise<WorkoutLog> {
    const [updatedLog] = await db
      .update(workoutLogs)
      .set({ count })
      .where(and(eq(workoutLogs.workoutId, workoutId), eq(workoutLogs.date, date)))
      .returning();
    return updatedLog;
  }

  async getWorkoutLogsByDateRange(startDate: string, endDate: string): Promise<WorkoutLog[]> {
    return await db
      .select()
      .from(workoutLogs)
      .where(and(
        eq(workoutLogs.date, startDate) // For now, we'll implement simple date filtering
      ));
  }

  async getSupplements(): Promise<Supplement[]> {
    return await db.select().from(supplements);
  }

  async createSupplement(supplement: InsertSupplement): Promise<Supplement> {
    const [newSupplement] = await db
      .insert(supplements)
      .values(supplement)
      .returning();
    return newSupplement;
  }

  async getSupplementLog(supplementId: number, date: string): Promise<SupplementLog | undefined> {
    const [log] = await db
      .select()
      .from(supplementLogs)
      .where(and(eq(supplementLogs.supplementId, supplementId), eq(supplementLogs.date, date)));
    return log || undefined;
  }

  async createSupplementLog(log: InsertSupplementLog): Promise<SupplementLog> {
    const [newLog] = await db
      .insert(supplementLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async updateSupplementLog(supplementId: number, date: string, taken: boolean): Promise<SupplementLog> {
    const [updatedLog] = await db
      .update(supplementLogs)
      .set({ taken })
      .where(and(eq(supplementLogs.supplementId, supplementId), eq(supplementLogs.date, date)))
      .returning();
    return updatedLog;
  }

  async getSupplementLogsByDateRange(startDate: string, endDate: string): Promise<SupplementLog[]> {
    return await db
      .select()
      .from(supplementLogs)
      .where(and(
        eq(supplementLogs.date, startDate) // For now, we'll implement simple date filtering
      ));
  }
}

export const storage = new DatabaseStorage();
