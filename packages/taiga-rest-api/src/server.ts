import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Import routes
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { sprintsRouter } from './routes/sprints.js';
import { issuesRouter } from './routes/issues.js';
import { userStoriesRouter } from './routes/userStories.js';
import { tasksRouter } from './routes/tasks.js';
import { commentsRouter } from './routes/comments.js';
import { attachmentsRouter } from './routes/attachments.js';
import { epicsRouter } from './routes/epics.js';
import { wikiRouter } from './routes/wiki.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ========================= MIDDLEWARE =========================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ========================= SWAGGER DOCUMENTATION =========================

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Taiga REST API',
      version: '2.0.0',
      description: 'REST API for Taiga project management - Compatible with n8n and other automation tools',
      contact: {
        name: 'API Support',
        email: 'greddy7574@gmail.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication (Base64 encoded username:password)',
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ========================= ROUTES =========================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/sprints', sprintsRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/user-stories', userStoriesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/attachments', attachmentsRouter);
app.use('/api/epics', epicsRouter);
app.use('/api/wiki', wikiRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Taiga REST API',
    version: '2.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      sprints: '/api/sprints',
      issues: '/api/issues',
      userStories: '/api/user-stories',
      tasks: '/api/tasks',
      comments: '/api/comments',
      attachments: '/api/attachments',
      epics: '/api/epics',
      wiki: '/api/wiki',
    },
  });
});

// ========================= ERROR HANDLING =========================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ========================= START SERVER =========================

app.listen(PORT, () => {
  console.log(`🚀 Taiga REST API server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app;
