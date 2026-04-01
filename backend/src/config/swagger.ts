import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lead Generation API',
      version: '1.0.0',
      description: `
        Lead Generation WebApp API Documentation
        
        ## Overview
        This API provides endpoints for managing leads, users, forms, and analytics
        for a lead generation platform with field agents, marketing team, and admin roles.
        
        ## Authentication
        Most endpoints require JWT authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <token>\`
        
        ## Roles
        - **super_admin**: Full system access
        - **admin**: Organization-level access
        - **marketing_manager**: Lead management and team oversight
        - **marketing_agent**: Lead processing and follow-up
        - **agent_supervisor**: Field agent oversight
        - **field_agent**: Lead collection in the field
      `,
      contact: {
        name: 'API Support',
        email: 'support@leadgen.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/${config.apiVersion}`,
        description: 'Development server',
      },
      {
        url: `https://api.leadgen.com/api/${config.apiVersion}`,
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        // Common Schemas
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        // Auth Schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'Password123!',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              example: 'Password123!',
            },
            firstName: {
              type: 'string',
              minLength: 2,
              example: 'John',
            },
            lastName: {
              type: 'string',
              minLength: 2,
              example: 'Doe',
            },
            phone: {
              type: 'string',
              example: '9876543210',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'integer', example: 900 },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        // User Schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            avatar: { type: 'string' },
            role: {
              type: 'string',
              enum: [
                'super_admin',
                'admin',
                'marketing_manager',
                'marketing_agent',
                'agent_supervisor',
                'field_agent',
              ],
            },
            isActive: { type: 'boolean' },
            isEmailVerified: { type: 'boolean' },
            organizationId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Lead Schemas
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            status: {
              type: 'string',
              enum: [
                'new',
                'contacted',
                'qualified',
                'negotiation',
                'converted',
                'lost',
                'invalid',
                'junk',
              ],
            },
            source: {
              type: 'string',
              enum: ['field_collection', 'website', 'referral', 'social_media', 'import', 'api'],
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
            },
            score: { type: 'integer' },
            formData: { type: 'object' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            address: { type: 'string' },
            createdById: { type: 'string', format: 'uuid' },
            assignedToId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateLeadRequest: {
          type: 'object',
          required: ['firstName', 'phone'],
          properties: {
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', example: '9876543210' },
            formData: { type: 'object' },
            latitude: { type: 'number', example: 28.6139 },
            longitude: { type: 'number', example: 77.209 },
            address: { type: 'string' },
          },
        },
        // Form Schemas
        Form: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            fields: { type: 'array', items: { type: 'object' } },
            isPublished: { type: 'boolean' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Unauthorized',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Forbidden',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Resource not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Validation failed',
                errors: [{ field: 'email', message: 'Invalid email address' }],
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Leads', description: 'Lead management endpoints' },
      { name: 'Forms', description: 'Form builder endpoints' },
      { name: 'Campaigns', description: 'Campaign management endpoints' },
      { name: 'Templates', description: 'Message template management and sending' },
      { name: 'Reminders', description: 'Lead follow-up reminders' },
      { name: 'Attendance', description: 'Agent attendance tracking and leave management' },
      { name: 'Analytics', description: 'Analytics and reporting endpoints' },
      { name: 'Notifications', description: 'Notification endpoints' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.controller.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
