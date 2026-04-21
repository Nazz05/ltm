import { prisma } from "../models/prisma";
import { HttpError } from "../utils/http-error";

// Service quản lý sản phẩm
// Chứa logic nghiệp vụ liên quan đến sản phẩm

interface ListProductsParams {
  skip: number;
  take: number;
  search?: string | undefined;
  categoryId?: number | undefined;
  sortBy?: string | undefined;
}

interface CreateProductData {
  name: string;
  desc?: string;
  price: number;
  stock: number;
  categoryId: number;
  image?: string;
}

interface UpdateProductData {
  name?: string;
  desc?: string;
  price?: number;
  stock?: number;
  image?: string;
}

export const productService = {
  // Lấy danh sách sản phẩm với pagination, tìm kiếm và filter
  async listProducts(params: ListProductsParams) {
    const { skip, take, search, categoryId, sortBy } = params;

    // Build where clause cho filter
    const whereClause: any = {};

    if (search) {
      // Tìm kiếm theo tên hoặc mô tả sản phẩm (case-insensitive)
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      // Filter theo danh mục
      whereClause.categoryId = categoryId;
    }

    // Build order by clause theo sortBy parameter
    let orderBy: any = { createdAt: "desc" }; // mặc định: mới nhất
    if (sortBy === "price_asc") {
      orderBy = { price: "asc" }; // giá thấp nhất
    } else if (sortBy === "price_desc") {
      orderBy = { price: "desc" }; // giá cao nhất
    } else if (sortBy === "popular") {
      orderBy = { CartItem: { _count: "desc" } }; // phổ biến nhất (được thêm vào giỏ nhiều nhất)
    }

    // Fetch products từ database
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip,
        take,
        orderBy,
        include: {
          category: true,
        },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return { products, total };
  },

  // Lấy chi tiết một sản phẩm
  async getProductById(productId: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new HttpError(404, "Sản phẩm không tồn tại", "NOT_FOUND");
    }

    return product;
  },

  // Tạo sản phẩm mới
  async createProduct(data: CreateProductData) {
    // Kiểm tra xem danh mục có tồn tại không
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new HttpError(404, "Danh mục không tồn tại", "NOT_FOUND");
    }

    // Tạo sản phẩm mới trong database
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, "-"), // Tự động tạo slug từ name
        ...(data.desc && { desc: data.desc }),
        price: data.price,
        stock: data.stock,
        categoryId: data.categoryId,
        ...(data.image && { image: data.image }),
      },
      include: {
        category: true,
      },
    });

    return product;
  },

  // Cập nhật thông tin sản phẩm
  async updateProduct(productId: number, data: UpdateProductData) {
    // Kiểm tra sản phẩm có tồn tại không
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new HttpError(404, "Sản phẩm không tồn tại", "NOT_FOUND");
    }

    // Filter data để chỉ cập nhật những trường được cung cấp
    // Dùng spread operator để chỉ include những field có giá trị (không undefined)
    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = data.name.toLowerCase().replace(/\s+/g, "-"); // Cập nhật slug theo name
    }
    if (data.desc !== undefined) updateData.desc = data.desc || null;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.image !== undefined) updateData.image = data.image || null;

    // Cập nhật sản phẩm trong database
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
      },
    });

    return updatedProduct;
  },

  // Xóa sản phẩm
  async deleteProduct(productId: number) {
    // Kiểm tra sản phẩm có tồn tại không
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new HttpError(404, "Sản phẩm không tồn tại", "NOT_FOUND");
    }

    // Xóa tất cả CartItems liên quan đến sản phẩm này trước
    await prisma.cartItem.deleteMany({
      where: { productId },
    });

    // Xóa sản phẩm
    await prisma.product.delete({
      where: { id: productId },
    });
  },

  // Lấy danh sách all danh mục
  async listCategories() {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }, // đếm số sản phẩm trong từng danh mục
        },
      },
      orderBy: { name: "asc" },
    });

    return categories;
  },
};
