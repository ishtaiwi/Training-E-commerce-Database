const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const router = express.Router();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce SaaS API',
      version: '1.0.0'
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'user@example.com' },
            password: { type: 'string', example: 'Password@123' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Osama' },
            email: { type: 'string', example: 'osama@test.com' },
            password: { type: 'string', example: 'Password@123' },
            role: { type: 'string', enum: ['Admin', 'Editor', 'Viewer'] }
          }
        },
        ProductCreateRequest: {
          type: 'object',
          required: ['name', 'price', 'stock'],
          properties: {
            name: { type: 'string', example: 'Phone X' },
            description: { type: 'string', example: 'Great device' },
            price: { type: 'number', example: 199.99 },
            stock: { type: 'integer', example: 10 }
          }
        },
        AddToCartRequest: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'string' },
            quantity: { type: 'integer', example: 1 }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register new user',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } }
          },
          responses: { '201': { description: 'Created' }, '409': { description: 'Email exists' } }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and get JWT',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
          },
          responses: { '200': { description: 'OK' }, '401': { description: 'Invalid credentials' } }
        }
      },
      '/products': {
        get: {
          tags: ['Products'],
          summary: 'List products',
          responses: { '200': { description: 'OK' } }
        }
      },
      '/carts/me/items': {
        post: {
          tags: ['Carts'],
          summary: 'Add item to cart',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AddToCartRequest' } } }
          },
          responses: { '200': { description: 'OK' } }
        },
        delete: {
          tags: ['Carts'],
          summary: 'Remove item from cart',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['productId'], properties: { productId: { type: 'string' } } } } }
          },
          responses: { '200': { description: 'OK' } }
        }
      },
      '/orders/me': {
        get: {
          tags: ['Orders'],
          summary: 'List my orders',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'OK' } }
        },
        post: {
          tags: ['Orders'],
          summary: 'Create order from my cart',
          security: [{ bearerAuth: [] }],
          responses: { '201': { description: 'Created' }, '400': { description: 'Cart empty' } }
        }
      },
      '/reports/sales-summary': {
        get: {
          tags: ['Reports'],
          summary: 'Sales summary (Admin)',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } }
        }
      }
    }
  },
  apis: []
};

const specs = swaggerJsdoc(options);
router.use('/', swaggerUi.serve, swaggerUi.setup(specs));

module.exports = router;

