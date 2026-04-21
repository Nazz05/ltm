import { prisma } from "../models/prisma";
import { HttpError } from "../utils/http-error";

// Service quản lý giỏ hàng
// Chứa logic nghiệp vụ liên quan đến giỏ hàng

export const cartService = {
  // Lấy giỏ hàng của người dùng (hoặc tạo mới nếu chưa có)
  async getCartByUserId(userId: number) {
    // Tìm hoặc tạo giỏ hàng cho user
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Nếu chưa có giỏ, tạo giỏ mới
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    // Tính tổng giá trị giỏ
    const totalPrice = cart.items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    return {
      ...cart,
      totalPrice,
      itemCount: cart.items.length,
    };
  },

  // Thêm sản phẩm vào giỏ hàng (hoặc tăng số lượng nếu đã có)
  async addToCart(userId: number, productId: number, quantity: number) {
    // Kiểm tra sản phẩm có tồn tại không
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new HttpError(404, "Sản phẩm không tồn tại", "NOT_FOUND");
    }

    // Kiểm tra số lượng sản phẩm trong kho
    if (product.stock < quantity) {
      throw new HttpError(
        400,
        `Sản phẩm chỉ còn ${product.stock} cái trong kho`,
        "VALIDATION_ERROR",
        { available: product.stock }
      );
    }

    // Tìm hoặc tạo giỏ hàng cho user
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Kiểm tra xem sản phẩm đã có trong giỏ không
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Nếu đã có, tăng số lượng
      const newQuantity = existingItem.quantity + quantity;

      // Kiểm tra lại số lượng kho sau khi tăng
      if (product.stock < newQuantity) {
        throw new HttpError(
          400,
          `Sản phẩm chỉ còn ${product.stock} cái trong kho`,
          "VALIDATION_ERROR",
          { available: product.stock, currentInCart: existingItem.quantity }
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Nếu chưa có, tạo CartItem mới
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Trả về giỏ hàng đã cập nhật
    return this.getCartByUserId(userId);
  },

  // Cập nhật số lượng một mục trong giỏ hàng
  async updateCartItem(userId: number, cartItemId: number, newQuantity: number) {
    // Lấy CartItem
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      throw new HttpError(404, "Mục giỏ hàng không tồn tại", "NOT_FOUND");
    }

    // Kiểm tra cartItem thuộc về user không
    if (cartItem.cart.userId !== userId) {
      throw new HttpError(403, "Không có quyền truy cập", "FORBIDDEN");
    }

    // Kiểm tra số lượng sản phẩm trong kho
    if (cartItem.product.stock < newQuantity) {
      throw new HttpError(
        400,
        `Sản phẩm chỉ còn ${cartItem.product.stock} cái trong kho`,
        "VALIDATION_ERROR",
        { available: cartItem.product.stock }
      );
    }

    // Cập nhật số lượng
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: newQuantity },
    });

    // Trả về giỏ hàng đã cập nhật
    return this.getCartByUserId(userId);
  },

  // Xóa một sản phẩm khỏi giỏ hàng
  async removeFromCart(userId: number, cartItemId: number) {
    // Lấy CartItem
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      throw new HttpError(404, "Mục giỏ hàng không tồn tại", "NOT_FOUND");
    }

    // Kiểm tra cartItem thuộc về user không
    if (cartItem.cart.userId !== userId) {
      throw new HttpError(403, "Không có quyền truy cập", "FORBIDDEN");
    }

    // Xóa CartItem
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    // Trả về giỏ hàng đã cập nhật
    return this.getCartByUserId(userId);
  },

  // Xóa tất cả sản phẩm trong giỏ
  async clearCart(userId: number) {
    // Tìm giỏ hàng
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new HttpError(404, "Giỏ hàng không tồn tại", "NOT_FOUND");
    }

    // Xóa tất cả CartItems trong giỏ
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Trả về giỏ hàng rỗng
    return this.getCartByUserId(userId);
  },

  // Tính tổng giá trị giỏ hàng (dùng cho order checkout)
  async calculateCartTotal(userId: number): Promise<number> {
    const cart = await this.getCartByUserId(userId);
    return cart.totalPrice;
  },
};
