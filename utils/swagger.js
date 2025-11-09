const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const router = express.Router();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce SaaS API',
      version: '1.0.0',
      description: 'Complete RESTful API for E-commerce platform with authentication, products, carts, orders, and analytics'
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Development server' },
      { url: '/api/v1', description: 'Current server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login'
        }
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@example.com' },
            password: { type: 'string', format: 'password', example: 'Admin@12345' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, example: 'Osama' },
            email: { type: 'string', format: 'email', example: 'osama@test.com' },
            password: { type: 'string', minLength: 6, format: 'password', example: 'Password@123' },
            role: { type: 'string', enum: ['Admin', 'Editor', 'Viewer'], example: 'Viewer' }
          }
        },
        RefreshTokenNote: {
          type: 'object',
          description: 'The refresh token is issued in an HTTP-only cookie named `refreshToken`.',
          properties: {
            message: { type: 'string', example: 'Refresh token is stored in HTTP-only cookie.' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '690b1a43fa9b950d23ecbf74' },
                name: { type: 'string', example: 'Osama' },
                email: { type: 'string', example: 'osama@test.com' },
                role: { type: 'string', example: 'Viewer' }
              }
            },
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '690b1a43fa9b950d23ecbf74' },
            name: { type: 'string', example: 'Wireless Mouse' },
            description: { type: 'string', example: 'Ergonomic wireless mouse' },
            price: { type: 'number', example: 29.99 },
            stock: { type: 'integer', example: 150 },
            images: { type: 'array', items: { type: 'string' }, example: ['/uploads/image1.jpg'] },
            createdAt: { type: 'string', format: 'date-time', example: '2025-01-15T10:30:00.000Z' }
          }
        },
        ProductCreateRequest: {
          type: 'object',
          required: ['name', 'price', 'stock'],
          properties: {
            name: { type: 'string', minLength: 2, example: 'Wireless Mouse' },
            description: { type: 'string', example: 'Ergonomic wireless mouse' },
            price: { type: 'number', minimum: 0, example: 29.99 },
            stock: { type: 'integer', minimum: 0, example: 150 },
            images: { 
              type: 'array', 
              items: { type: 'string', format: 'binary' }, 
              description: 'Image files (optional, max 5) - You can leave this empty if you don\'t want to upload images',
              maxItems: 5
            }
          }
        },
        ProductUpdateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, example: 'Wireless Mouse Pro' },
            description: { type: 'string', example: 'Updated description' },
            price: { type: 'number', minimum: 0, example: 39.99 },
            stock: { type: 'integer', minimum: 0, example: 200 },
            images: { 
              type: 'array', 
              items: { type: 'string', format: 'binary' }, 
              description: 'Additional image files (optional, max 5) - You can leave this empty',
              maxItems: 5
            }
          }
        },
        ProductListResponse: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            pages: { type: 'integer', example: 10 }
          }
        },
        AddToCartRequest: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'string', example: '690b1a43fa9b950d23ecbf74' },
            quantity: { type: 'integer', minimum: 1, example: 2 }
          }
        },
        RemoveFromCartRequest: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'string', example: '690b1a43fa9b950d23ecbf74' }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '690b1a43fa9b950d23ecbf74' },
            user: { type: 'string', example: '690b1a43fa9b950d23ecbf75' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { $ref: '#/components/schemas/Product' },
                  quantity: { type: 'integer', example: 2 }
                }
              }
            },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '690b1a43fa9b950d23ecbf74' },
            user: { type: 'string', example: '690b1a43fa9b950d23ecbf75' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { type: 'string', example: '690b1a43fa9b950d23ecbf76' },
                  quantity: { type: 'integer', example: 2 },
                  priceAtPurchase: { type: 'number', example: 29.99 }
                }
              }
            },
            total: { type: 'number', example: 59.98 },
            status: { type: 'string', enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'], example: 'pending' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        UpdateOrderStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'], example: 'paid' }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '690b1a43fa9b950d23ecbf74' },
            name: { type: 'string', example: 'Osama' },
            email: { type: 'string', example: 'osama@test.com' },
            role: { type: 'string', enum: ['Admin', 'Editor', 'Viewer'], example: 'Viewer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        UpdateUserRoleRequest: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['Admin', 'Editor', 'Viewer'], example: 'Editor' }
          }
        },
        SalesSummary: {
          type: 'object',
          properties: {
            totalSales: { type: 'number', example: 50000.99 },
            ordersCount: { type: 'integer', example: 150 }
          }
        },
        TopProduct: {
          type: 'object',
          properties: {
            productId: { type: 'string', example: '690b1a43fa9b950d23ecbf74' },
            name: { type: 'string', example: 'Wireless Mouse' },
            totalSold: { type: 'integer', example: 500 },
            revenue: { type: 'number', example: 14995.00 }
          }
        },
        OrdersPerUser: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '690b1a43fa9b950d23ecbf75' },
            count: { type: 'integer', example: 25 },
            total: { type: 'number', example: 5000.00 }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error message' }
          }
        }
      }
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          description: 'Create a new user account. Returns an access token in the response body and sets the refresh token in an HTTP-only cookie.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' }
                }
              },
              headers: {
                'Set-Cookie': {
                  description: 'Contains the HTTP-only `refreshToken` cookie used for rotation.',
                  schema: { type: 'string' }
                }
              }
            },
            '400': { description: 'Validation error', schema: { $ref: '#/components/schemas/Error' } },
            '409': { description: 'Email already registered', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and get JWT tokens',
          description: 'Authenticate user and receive an access token in the body. Refresh token is issued in an HTTP-only cookie.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' }
                }
              },
              headers: {
                'Set-Cookie': {
                  description: 'Contains the HTTP-only `refreshToken` cookie used for rotation.',
                  schema: { type: 'string' }
                }
              }
            },
            '400': { description: 'Validation error', schema: { $ref: '#/components/schemas/Error' } },
            '401': { description: 'Invalid credentials', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          description: 'Get new access token using the refresh token stored in an HTTP-only cookie.',
          responses: {
            '200': {
              description: 'Tokens refreshed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                    }
                  }
                }
              },
              headers: {
                'Set-Cookie': {
                  description: 'Contains the rotated HTTP-only `refreshToken` cookie.',
                  schema: { type: 'string' }
                }
              }
            },
            '401': { description: 'Invalid token', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Log out current session',
          description: 'Revokes the current refresh token and clears the HTTP-only cookie.',
          responses: {
            '204': { description: 'Logged out successfully. Refresh cookie cleared.' }
          }
        }
      },
      '/auth/google': {
        get: {
          tags: ['Auth'],
          summary: 'Start Google OAuth flow',
          description: 'Redirects the user to Google for OAuth 2.0 authentication.',
          responses: {
            '302': {
              description: 'Redirect to Google OAuth consent screen',
              headers: {
                Location: {
                  description: 'Google OAuth consent URL',
                  schema: { type: 'string' }
                }
              }
            }
          }
        }
      },
      '/auth/google/callback': {
        get: {
          tags: ['Auth'],
          summary: 'Handle Google OAuth callback',
          description: 'Completes Google OAuth login, issues an access token in the body, and sets the refresh token in an HTTP-only cookie.',
          responses: {
            '200': {
              description: 'Google login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' }
                }
              },
              headers: {
                'Set-Cookie': {
                  description: 'Contains the HTTP-only `refreshToken` cookie used for rotation.',
                  schema: { type: 'string' }
                }
              }
            },
            '401': { description: 'Google authentication failed', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/auth/google/failure': {
        get: {
          tags: ['Auth'],
          summary: 'Google OAuth failure',
          description: 'Returns an error response when Google authentication fails.',
          responses: {
            '401': { description: 'Google authentication failed', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/products': {
        get: {
          tags: ['Products'],
          summary: 'List all products',
          description: 'Get paginated list of products with optional filtering and search.',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Items per page' },
            { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' }, description: 'Sort field (prefix with - for descending)' },
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search query (searches in product name)' },
            { name: 'minPrice', in: 'query', schema: { type: 'number' }, description: 'Minimum price filter' },
            { name: 'maxPrice', in: 'query', schema: { type: 'number' }, description: 'Maximum price filter' }
          ],
          responses: {
            '200': {
              description: 'Products retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ProductListResponse' }
                }
              }
            }
          }
        },
        post: {
          tags: ['Products'],
          summary: 'Create a new product',
          description: 'Create a new product. Requires Admin or Editor role. Image upload is optional - you can test without uploading images by leaving the images field empty.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: { $ref: '#/components/schemas/ProductCreateRequest' }
              }
            }
          },
          responses: {
            '201': {
              description: 'Product created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Product' }
                }
              }
            },
            '400': { description: 'Validation error', schema: { $ref: '#/components/schemas/Error' } },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } },
            '403': { description: 'Forbidden - Requires Admin or Editor role', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Get product by ID',
          description: 'Retrieve a single product by its ID.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Product ID' }
          ],
          responses: {
            '200': {
              description: 'Product retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Product' }
                }
              }
            },
            '404': { description: 'Product not found', schema: { $ref: '#/components/schemas/Error' } }
          }
        },
        patch: {
          tags: ['Products'],
          summary: 'Update a product',
          description: 'Update product information. Requires Admin or Editor role. Can add additional images (optional - leave images field empty if not needed).',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Product ID' }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: { $ref: '#/components/schemas/ProductUpdateRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Product updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Product' }
                }
              }
            },
            '400': { description: 'Validation error', schema: { $ref: '#/components/schemas/Error' } },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } },
            '403': { description: 'Forbidden - Requires Admin or Editor role', schema: { $ref: '#/components/schemas/Error' } },
            '404': { description: 'Product not found', schema: { $ref: '#/components/schemas/Error' } }
          }
        },
        delete: {
          tags: ['Products'],
          summary: 'Delete a product',
          description: 'Delete a product. Requires Admin role.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Product ID' }
          ],
          responses: {
            '200': {
              description: 'Product deleted successfully',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { success: { type: 'boolean', example: true } } }
                }
              }
            },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } },
            '403': { description: 'Forbidden - Requires Admin role', schema: { $ref: '#/components/schemas/Error' } },
            '404': { description: 'Product not found', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/carts/me': {
        get: {
          tags: ['Carts'],
          summary: 'Get my cart',
          description: 'Retrieve the current user\'s shopping cart with populated product details.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Cart retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Cart' }
                }
              }
            },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } }
          }
        },
        delete: {
          tags: ['Carts'],
          summary: 'Clear my cart',
          description: 'Remove all items from the current user\'s cart.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Cart cleared successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Cart' }
                }
              }
            },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/carts/me/items': {
        post: {
          tags: ['Carts'],
          summary: 'Add item to cart',
          description: 'Add a product to the current user\'s cart. If product already exists, quantity is incremented.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AddToCartRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Item added to cart successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Cart' }
                }
              }
            },
            '400': { description: 'Validation error', schema: { $ref: '#/components/schemas/Error' } },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } }
          }
        },
        delete: {
          tags: ['Carts'],
          summary: 'Remove item from cart',
          description: 'Remove a specific product from the current user\'s cart.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RemoveFromCartRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Item removed from cart successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Cart' }
                }
              }
            },
            '400': { description: 'Validation error', schema: { $ref: '#/components/schemas/Error' } },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/orders/me': {
        get: {
          tags: ['Orders'],
          summary: 'List my orders',
          description: 'Get all orders for the current user with populated product details.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Orders retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Order' }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } }
          }
        },
        post: {
          tags: ['Orders'],
          summary: 'Create order from cart',
          description: 'Create a new order from the current user\'s cart. Cart is cleared after order creation. Stock is decremented.',
          security: [{ bearerAuth: [] }],
          responses: {
            '201': {
              description: 'Order created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Order' }
                }
              }
            },
            '400': { description: 'Cart is empty', schema: { $ref: '#/components/schemas/Error' } },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/orders/{id}/status': {
        patch: {
          tags: ['Orders'],
          summary: 'Update order status',
          description: 'Update the status of an order. Requires Admin or Editor role.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Order ID' }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateOrderStatusRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Order status updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Order' }
                }
              }
            },
            '400': { description: 'Validation error', schema: { $ref: '#/components/schemas/Error' } },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } },
            '403': { description: 'Forbidden - Requires Admin or Editor role', schema: { $ref: '#/components/schemas/Error' } },
            '404': { description: 'Order not found', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/users/me': {
        get: {
          tags: ['Users'],
          summary: 'Get my profile',
          description: 'Get the current authenticated user\'s profile information.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User profile retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } },
            '404': { description: 'User not found', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'List all users',
          description: 'Get list of all users. Requires Admin role.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Users retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } },
            '403': { description: 'Forbidden - Requires Admin role', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/users/{id}/role': {
        patch: {
          tags: ['Users'],
          summary: 'Update user role',
          description: 'Update a user\'s role. Requires Admin role.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User ID' }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateUserRoleRequest' }
              }
            }
          },
          responses: {
            '200': {
              description: 'User role updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '400': { description: 'Validation error', schema: { $ref: '#/components/schemas/Error' } },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } },
            '403': { description: 'Forbidden - Requires Admin role', schema: { $ref: '#/components/schemas/Error' } },
            '404': { description: 'User not found', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/reports/sales-summary': {
        get: {
          tags: ['Reports'],
          summary: 'Get sales summary',
          description: 'Get total sales and order count. Requires Admin role.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Sales summary retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SalesSummary' }
                }
              }
            },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } },
            '403': { description: 'Forbidden - Requires Admin role', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/reports/top-products': {
        get: {
          tags: ['Reports'],
          summary: 'Get top products by sales',
          description: 'Get top selling products by quantity sold and revenue. Requires Admin role.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 5, minimum: 1, maximum: 100 }, description: 'Number of top products to return' }
          ],
          responses: {
            '200': {
              description: 'Top products retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TopProduct' }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } },
            '403': { description: 'Forbidden - Requires Admin role', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      },
      '/reports/orders-per-user': {
        get: {
          tags: ['Reports'],
          summary: 'Get orders per user statistics',
          description: 'Get order count and total sales per user. Requires Admin role.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/OrdersPerUser' }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized', schema: { $ref: '#/components/schemas/Error' } },
            '403': { description: 'Forbidden - Requires Admin role', schema: { $ref: '#/components/schemas/Error' } }
          }
        }
      }
    }
  },
  apis: []
};

const specs = swaggerJsdoc(options);
router.use('/', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'E-commerce API Documentation'
}));

module.exports = router;
