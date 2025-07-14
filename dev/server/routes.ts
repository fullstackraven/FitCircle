import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkoutSchema, insertWorkoutLogSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Workout routes
  app.get('/api/workouts', async (req, res) => {
    try {
      const workouts = await storage.getWorkouts();
      res.json(workouts);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      res.status(500).json({ error: 'Failed to fetch workouts' });
    }
  });

  app.post('/api/workouts', async (req, res) => {
    try {
      const validatedData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout(validatedData);
      res.json(workout);
    } catch (error) {
      console.error('Error creating workout:', error);
      res.status(400).json({ error: 'Failed to create workout' });
    }
  });

  // Workout logs routes
  app.get('/api/workout-logs/:workoutId/:date', async (req, res) => {
    try {
      const { workoutId, date } = req.params;
      const log = await storage.getWorkoutLog(parseInt(workoutId), date);
      res.json(log || { workoutId: parseInt(workoutId), date, count: 0 });
    } catch (error) {
      console.error('Error fetching workout log:', error);
      res.status(500).json({ error: 'Failed to fetch workout log' });
    }
  });

  app.post('/api/workout-logs', async (req, res) => {
    try {
      const validatedData = insertWorkoutLogSchema.parse(req.body);
      
      // Check if log already exists
      const existingLog = await storage.getWorkoutLog(validatedData.workoutId, validatedData.date);
      
      let log;
      if (existingLog) {
        log = await storage.updateWorkoutLog(validatedData.workoutId, validatedData.date, validatedData.count);
      } else {
        log = await storage.createWorkoutLog(validatedData);
      }
      
      res.json(log);
    } catch (error) {
      console.error('Error creating/updating workout log:', error);
      res.status(400).json({ error: 'Failed to create/update workout log' });
    }
  });

  app.get('/api/workout-logs/range/:startDate/:endDate', async (req, res) => {
    try {
      const { startDate, endDate } = req.params;
      const logs = await storage.getWorkoutLogsByDateRange(startDate, endDate);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching workout logs by date range:', error);
      res.status(500).json({ error: 'Failed to fetch workout logs' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
