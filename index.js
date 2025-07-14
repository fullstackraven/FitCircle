var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

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

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getWorkouts() {
    return await db.select().from(workouts);
  }
  async createWorkout(workout) {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }
  async getWorkoutLog(workoutId, date) {
    const [log2] = await db.select().from(workoutLogs).where(and(eq(workoutLogs.workoutId, workoutId), eq(workoutLogs.date, date)));
    return log2 || void 0;
  }
  async createWorkoutLog(log2) {
    const [newLog] = await db.insert(workoutLogs).values(log2).returning();
    return newLog;
  }
  async updateWorkoutLog(workoutId, date, count) {
    const [updatedLog] = await db.update(workoutLogs).set({ count }).where(and(eq(workoutLogs.workoutId, workoutId), eq(workoutLogs.date, date))).returning();
    return updatedLog;
  }
  async getWorkoutLogsByDateRange(startDate, endDate) {
    return await db.select().from(workoutLogs).where(and(
      eq(workoutLogs.date, startDate)
      // For now, we'll implement simple date filtering
    ));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/workouts", async (req, res) => {
    try {
      const workouts2 = await storage.getWorkouts();
      res.json(workouts2);
    } catch (error) {
      console.error("Error fetching workouts:", error);
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });
  app2.post("/api/workouts", async (req, res) => {
    try {
      const validatedData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout(validatedData);
      res.json(workout);
    } catch (error) {
      console.error("Error creating workout:", error);
      res.status(400).json({ error: "Failed to create workout" });
    }
  });
  app2.get("/api/workout-logs/:workoutId/:date", async (req, res) => {
    try {
      const { workoutId, date } = req.params;
      const log2 = await storage.getWorkoutLog(parseInt(workoutId), date);
      res.json(log2 || { workoutId: parseInt(workoutId), date, count: 0 });
    } catch (error) {
      console.error("Error fetching workout log:", error);
      res.status(500).json({ error: "Failed to fetch workout log" });
    }
  });
  app2.post("/api/workout-logs", async (req, res) => {
    try {
      const validatedData = insertWorkoutLogSchema.parse(req.body);
      const existingLog = await storage.getWorkoutLog(validatedData.workoutId, validatedData.date);
      let log2;
      if (existingLog) {
        log2 = await storage.updateWorkoutLog(validatedData.workoutId, validatedData.date, validatedData.count);
      } else {
        log2 = await storage.createWorkoutLog(validatedData);
      }
      res.json(log2);
    } catch (error) {
      console.error("Error creating/updating workout log:", error);
      res.status(400).json({ error: "Failed to create/update workout log" });
    }
  });
  app2.get("/api/workout-logs/range/:startDate/:endDate", async (req, res) => {
    try {
      const { startDate, endDate } = req.params;
      const logs = await storage.getWorkoutLogsByDateRange(startDate, endDate);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching workout logs by date range:", error);
      res.status(500).json({ error: "Failed to fetch workout logs" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
