import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { config } from './config';
import { morganStream } from './config/logger';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import { authRoutes } from './modules/auth';
import { usersRoutes } from './modules/users';
import { leadsRoutes } from './modules/leads';
import { formsRoutes } from './modules/forms';
import { campaignsRoutes } from './modules/campaigns';
import { templatesRoutes } from './modules/templates';
import { remindersRoutes } from './modules/reminders';
import { targetsRoutes } from './modules/targets';
import { attendanceRoutes } from './modules/attendance';
import { analyticsRoutes } from './modules/analytics';
import { notificationsRoutes } from './modules/notifications';
import { teamsRoutes } from './modules/teams';
import { organizationsRoutes } from './modules/organization';
import { invoiceTemplatesRoutes } from './modules/invoice-templates';
import { invoicesRoutes } from './modules/invoices';

const app: Application = express();

// =============================================
// Security Middleware
// =============================================

// Helmet - Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: config.cors.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  // Keep strict limits in production but avoid blocking local dev workflows.
  skip: () => config.isDevelopment,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// =============================================
// General Middleware
// =============================================

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// HTTP request logging
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: morganStream }));
}

// =============================================
// API Documentation
// =============================================

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'LeadGen API Documentation',
  })
);

// Swagger JSON endpoint
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// =============================================
// Health Check
// =============================================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: '1.0.0',
  });
});

// =============================================
// API Routes
// =============================================

const apiPrefix = `/api/${config.apiVersion}`;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, usersRoutes);
app.use(`${apiPrefix}/leads`, leadsRoutes);
app.use(`${apiPrefix}/forms`, formsRoutes);
app.use(`${apiPrefix}/campaigns`, campaignsRoutes);
app.use(`${apiPrefix}/templates`, templatesRoutes);
app.use(`${apiPrefix}/reminders`, remindersRoutes);
app.use(`${apiPrefix}/targets`, targetsRoutes);
app.use(`${apiPrefix}/attendance`, attendanceRoutes);
app.use(`${apiPrefix}/teams`, teamsRoutes);
app.use(`${apiPrefix}/organizations`, organizationsRoutes);
app.use(`${apiPrefix}/analytics`, analyticsRoutes);
app.use(`${apiPrefix}/notifications`, notificationsRoutes);
app.use(`${apiPrefix}/invoice-templates`, invoiceTemplatesRoutes);
app.use(`${apiPrefix}/invoices`, invoicesRoutes);

// =============================================
// Error Handling
// =============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
