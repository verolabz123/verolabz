// IMPORTANT: Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import { initializeFirebase } from "./config/firebase.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";

// Routes
import candidateRoutes from "./routes/candidate.routes.js";
import evaluationRoutes from "./routes/evaluation.routes.js";
import healthRoutes from "./routes/health.routes.js";
import bulkUploadRoutes from "./routes/bulkUpload.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import enhancedEvaluationRoutes from "./routes/enhanced-evaluation.routes.js";
import ocrRoutes from "./routes/ocr.routes.js";

// Constants
const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";
const API_PREFIX = process.env.API_PREFIX || "/api/v1";
const NODE_ENV = process.env.NODE_ENV || "development";

// Initialize Express app
const app: Application = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// Compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Health check endpoint (no prefix)
app.use("/health", healthRoutes);

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/user`, userRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/resumes`, resumeRoutes);
app.use(`${API_PREFIX}/candidates`, candidateRoutes);
app.use(`${API_PREFIX}/evaluation`, evaluationRoutes);
app.use(`${API_PREFIX}/enhanced-evaluation`, enhancedEvaluationRoutes);
app.use(`${API_PREFIX}/bulk`, bulkUploadRoutes);
app.use(`${API_PREFIX}/ocr`, ocrRoutes);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    name: "HR Automation Backend",
    version: "1.0.0",
    description: "AI-powered candidate evaluation system with Groq",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      api: API_PREFIX,
      auth: `${API_PREFIX}/auth`,
      user: `${API_PREFIX}/user`,
      dashboard: `${API_PREFIX}/dashboard`,
      resumes: `${API_PREFIX}/resumes`,
      candidates: `${API_PREFIX}/candidates`,
      evaluation: `${API_PREFIX}/evaluation`,
      enhancedEvaluation: `${API_PREFIX}/enhanced-evaluation`,
      bulk: `${API_PREFIX}/bulk`,
      ocr: `${API_PREFIX}/ocr`,
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize Firebase and start server
async function startServer() {
  try {
    // Initialize Firebase Admin SDK
    logger.info("Initializing Firebase Admin SDK...");
    await initializeFirebase();
    logger.info("Firebase Admin SDK initialized successfully");

    // Start Express server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        HR Automation Backend - AI Evaluation System        ║
║                                                            ║
║  Server running on: http://${HOST}:${PORT}                    ║
║  Environment: ${NODE_ENV.padEnd(42)}║
║  API Prefix: ${API_PREFIX.padEnd(43)}║
║                                                            ║
║  Powered by Groq AI & Firebase                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
      logger.info("Server is ready to accept connections");
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info("HTTP server closed");

        try {
          logger.info("All connections closed");
          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception:", error);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
