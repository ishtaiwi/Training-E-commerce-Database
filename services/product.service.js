const Product = require('../models/Product');

class ProductService {
  processUploadedFiles(files) {
    return (files || []).map(file => `/uploads/${file.filename}`);
  }

  async createProduct(data, files) {
    const images = this.processUploadedFiles(files);
    return await Product.create({ ...data, images });
  }

  async getProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async listProducts(query) {
    const { page = 1, limit = 10, sort = '-createdAt', q, minPrice, maxPrice } = query;
    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = { ...(minPrice && { $gte: Number(minPrice) }), ...(maxPrice && { $lte: Number(maxPrice) }) };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Product.find(filter).sort(String(sort)).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter)
    ]);
    return { items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
  }

  async updateProduct(id, data, files) {
    const update = { ...data };
    if (files && files.length > 0) {
      const images = this.processUploadedFiles(files);
      update.$push = { images: { $each: images } };
    }
    const product = await Product.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async deleteProduct(id) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async decrementStock(productId, quantity) {
    const result = await Product.updateOne(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } }
    );
    if (result.modifiedCount !== 1) {
      throw new Error('Insufficient stock');
    }
    return result;
  }
}

module.exports = new ProductService();
