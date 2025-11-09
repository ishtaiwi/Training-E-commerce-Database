const productService = require('../services/product.service');
const auditService = require('../services/audit.service');

function buildAuditContext(req) {
  return {
    actor: req.user ? {
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role
    } : undefined,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
}

exports.createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.files);

    await auditService.record('product.created', {
      ...buildAuditContext(req),
      target: {
        type: 'Product',
        id: product.id,
        name: product.name
      },
      metadata: {
        price: product.price,
        stock: product.stock,
        imagesCount: Array.isArray(product.images) ? product.images.length : 0
      }
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.listProducts = async (req, res, next) => {
  try {
    const result = await productService.listProducts(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProduct(req.params.id);
    res.json(product);
  } catch (err) {
    if (err.message === 'Product not found') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const existingProduct = await productService.getProduct(req.params.id);
    const product = await productService.updateProduct(req.params.id, req.body, req.files);

    const changes = {};
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        changes[key] = {
          before: existingProduct[key],
          after: product[key]
        };
      });
    }
    if (req.files && req.files.length > 0) {
      changes.imagesAppended = req.files.length;
    }

    await auditService.record('product.updated', {
      ...buildAuditContext(req),
      target: {
        type: 'Product',
        id: product.id,
        name: product.name
      },
      metadata: { changes }
    });

    res.json(product);
  } catch (err) {
    if (err.message === 'Product not found') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await productService.deleteProduct(req.params.id);

    await auditService.record('product.deleted', {
      ...buildAuditContext(req),
      target: {
        type: 'Product',
        id: product.id,
        name: product.name
      },
      metadata: {
        price: product.price,
        stock: product.stock
      }
    });

    res.json({ success: true });
  } catch (err) {
    if (err.message === 'Product not found') {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
};
