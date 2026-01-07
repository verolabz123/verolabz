import { Router, Request, Response } from 'express';
import { getGroqClient } from '../config/groq.js';
import { getDB } from '../config/firebase.js';

const router = Router();

/**
 * Health check endpoint
 * GET /health
 */
router.get('/', async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      groq: { status: 'unknown', message: '' },
      firebase: { status: 'unknown', message: '' },
      redis: { status: 'unknown', message: '' },
    },
  };

  // Check Groq API
  try {
    const groqClient = getGroqClient();
    if (groqClient) {
      healthCheck.services.groq = { status: 'healthy', message: 'Connected' };
    }
  } catch (error) {
    healthCheck.services.groq = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Connection failed',
    };
    healthCheck.status = 'degraded';
  }

  // Check Firebase
  try {
    const db = getDB();
    // Simple read operation to test connection
    await db.collection('_health_check').limit(1).get();
    healthCheck.services.firebase = { status: 'healthy', message: 'Connected' };
  } catch (error) {
    healthCheck.services.firebase = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Connection failed',
    };
    healthCheck.status = 'degraded';
  }

  // Check Redis (optional)
  if (process.env.REDIS_HOST) {
    try {
      // Add Redis check here if implemented
      healthCheck.services.redis = { status: 'not_configured', message: 'Optional' };
    } catch (error) {
      healthCheck.services.redis = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  } else {
    healthCheck.services.redis = { status: 'not_configured', message: 'Not configured' };
  }

  // Determine overall status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;

  res.status(statusCode).json(healthCheck);
});

/**
 * Liveness probe
 * GET /health/live
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe
 * GET /health/ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check critical services
    const groqClient = getGroqClient();
    const db = getDB();

    if (!groqClient) {
      throw new Error('Groq client not initialized');
    }

    if (!db) {
      throw new Error('Firebase not initialized');
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      message: error instanceof Error ? error.message : 'Service not ready',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
