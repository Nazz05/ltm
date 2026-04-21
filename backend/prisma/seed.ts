import 'dotenv/config';

// Verify DATABASE_URL is loaded
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set. Check your .env file.');
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// For Prisma v7, we need to create a custom client
const prisma = new PrismaClient();

function requireItem<T>(items: readonly T[], index: number, label: string): T {
  const item = items[index];

  if (!item) {
    throw new Error(`${label} at index ${index} was not found during seed generation.`);
  }

  return item;
}

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  // Clear existing data (for dev only)
  await prisma.auditLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Dữ liệu cũ đã được xóa');

  // 0. Create Payment Methods
  console.log('💳 Tạo phương thức thanh toán...');

  const paymentMethods = await Promise.all([
    prisma.paymentMethod.create({
      data: {
        name: 'Thẻ Tín Dụng / Ghi Nợ',
        code: 'CARD',
        description: 'Thanh toán bằng thẻ tín dụng hoặc thẻ ghi nợ',
        icon: '💳',
        isActive: true,
        displayOrder: 1,
      },
    }),
    prisma.paymentMethod.create({
      data: {
        name: 'Chuyển Khoản Ngân Hàng',
        code: 'BANK',
        description: 'Chuyển tiền trực tiếp vào tài khoản ngân hàng',
        icon: '🏦',
        isActive: true,
        displayOrder: 2,
      },
    }),
    prisma.paymentMethod.create({
      data: {
        name: 'Ví Điện Tử',
        code: 'WALLET',
        description: 'Thanh toán qua ví điện tử (Momo, Zalo Pay, ViettelPay)',
        icon: '📱',
        isActive: true,
        displayOrder: 3,
      },
    }),
    prisma.paymentMethod.create({
      data: {
        name: 'Thanh Toán Khi Nhận',
        code: 'COD',
        description: 'Thanh toán tiền mặt khi nhận hàng',
        icon: '🚚',
        isActive: true,
        displayOrder: 4,
      },
    }),
  ]);

  console.log(`✓ Tạo ${paymentMethods.length} phương thức thanh toán`);

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  // 1. Create Users
  console.log('👤 Tạo tài khoản người dùng...');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ltwnc.tech',
      password: adminPassword,
      fullName: 'Admin User',
      phone: '0123456789',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const testUsers = [
    {
      email: 'user@ltwnc.tech',
      password: userPassword,
      fullName: 'Test User 1',
      phone: '0987654321',
    },
    {
      email: 'user2@ltwnc.tech',
      password: userPassword,
      fullName: 'Test User 2',
      phone: '0987654322',
    },
    {
      email: 'user3@ltwnc.tech',
      password: userPassword,
      fullName: 'Test User 3',
      phone: '0987654323',
    },
    {
      email: 'user4@ltwnc.tech',
      password: userPassword,
      fullName: 'Test User 4',
      phone: '0987654324',
    },
    {
      email: 'user5@ltwnc.tech',
      password: userPassword,
      fullName: 'Test User 5',
      phone: '0987654325',
    },
  ];

  const seededUsers = await Promise.all(
    testUsers.map((testUser) =>
      prisma.user.create({
        data: {
          ...testUser,
          role: 'USER',
          isActive: true,
        },
      })
    )
  );

  console.log(`✓ Tạo ${1 + seededUsers.length} tài khoản: ${admin.email}, ${seededUsers.map((item) => item.email).join(', ')}`);

  // 2. Create Addresses
  console.log('📍 Tạo địa chỉ...');

  const addressSeeds = [
    {
      userId: requireItem(seededUsers, 0, 'seeded user').id,
      street: '123 Đường ABC',
      ward: 'Phường 1',
      district: 'Quận 1',
      city: 'TP Hồ Chí Minh',
      zipCode: '70000',
      isDefault: true,
    },
    {
      userId: requireItem(seededUsers, 1, 'seeded user').id,
      street: '45 Nguyễn Trãi',
      ward: 'Phường 2',
      district: 'Quận 5',
      city: 'TP Hồ Chí Minh',
      zipCode: '70001',
      isDefault: true,
    },
    {
      userId: requireItem(seededUsers, 2, 'seeded user').id,
      street: '88 Trần Hưng Đạo',
      ward: 'Phường 3',
      district: 'Quận 1',
      city: 'TP Hồ Chí Minh',
      zipCode: '70002',
      isDefault: true,
    },
    {
      userId: requireItem(seededUsers, 3, 'seeded user').id,
      street: '12 Lê Lợi',
      ward: 'Phường 4',
      district: 'Quận 3',
      city: 'TP Hồ Chí Minh',
      zipCode: '70003',
      isDefault: true,
    },
    {
      userId: requireItem(seededUsers, 4, 'seeded user').id,
      street: '256 Điện Biên Phủ',
      ward: 'Phường 5',
      district: 'Quận Bình Thạnh',
      city: 'TP Hồ Chí Minh',
      zipCode: '70004',
      isDefault: true,
    },
  ];

  await Promise.all(addressSeeds.map((address) => prisma.address.create({ data: address })));

  console.log(`✓ Tạo ${addressSeeds.length} địa chỉ mẫu cho nhiều user`);

  // 3. Create Categories
  console.log('📦 Tạo danh mục sản phẩm...');

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Nam',
        slug: 'nam',
        desc: 'Quần áo dành cho nam',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Nữ',
        slug: 'nu',
        desc: 'Quần áo dành cho nữ',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Giày',
        slug: 'giay',
        desc: 'Giày thời trang',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Phụ kiện',
        slug: 'phu-kien',
        desc: 'Phụ kiện thời trang',
      },
    }),
  ]);

  console.log(`✓ Tạo ${categories.length} danh mục`);

  // 4. Create Products
  console.log('🛍️ Tạo sản phẩm mẫu...');
  const productSeeds = [
    {
      categoryIndex: 0,
      name: 'Áo thun nam cơ bản',
      slug: 'ao-thun-nam-co-ban-1',
      desc: 'Áo thun 100% cotton, thoải mái và bền',
      price: 199000,
      originPrice: 299000,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 0,
      name: 'Áo sơ mi nam trắng',
      slug: 'ao-so-mi-nam-trang-1',
      desc: 'Áo sơ mi linen phù hợp cho mùa hè',
      price: 349000,
      originPrice: 499000,
      stock: 30,
      image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 0,
      name: 'Quần jeans nam vệt',
      slug: 'quan-jeans-nam-vet-1',
      desc: 'Quần jeans phong cách với thiết kế vệt hiện đại',
      price: 549000,
      originPrice: 799000,
      stock: 25,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 0,
      name: 'Áo khoác bomber nam',
      slug: 'ao-khoac-bomber-nam-1',
      desc: 'Áo khoác bomber trẻ trung, dễ phối đồ',
      price: 459000,
      originPrice: 629000,
      stock: 18,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 0,
      name: 'Quần short nam thể thao',
      slug: 'quan-short-nam-the-thao-1',
      desc: 'Quần short nhẹ, thoáng, phù hợp vận động',
      price: 219000,
      originPrice: 299000,
      stock: 40,
      image: 'https://images.unsplash.com/photo-1506629082632-401017062f27?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 1,
      name: 'Áo thun nữ cơ bản',
      slug: 'ao-thun-nu-co-ban-1',
      desc: 'Áo thun nữ mềm mại, ôm dáng',
      price: 189000,
      originPrice: 289000,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 1,
      name: 'Váy nữ xếp li',
      slug: 'vay-nu-xep-li-1',
      desc: 'Váy xếp li thanh lịch, phù hợp dạo phố',
      price: 399000,
      originPrice: 599000,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 1,
      name: 'Quần legging nữ',
      slug: 'quan-legging-nu-1',
      desc: 'Quần legging thoải mái cho tập luyện',
      price: 249000,
      originPrice: 399000,
      stock: 40,
      image: 'https://images.unsplash.com/photo-1506629082632-401017062f27?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 1,
      name: 'Áo kiểu nữ tay phồng',
      slug: 'ao-kieu-nu-tay-phong-1',
      desc: 'Áo kiểu thanh lịch, dễ phối chân váy hoặc quần jeans',
      price: 279000,
      originPrice: 349000,
      stock: 22,
      image: 'https://images.unsplash.com/photo-1552836906-46f150019f45?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 1,
      name: 'Chân váy chữ A',
      slug: 'chan-vay-chu-a-1',
      desc: 'Chân váy chữ A basic, hợp nhiều hoàn cảnh',
      price: 329000,
      originPrice: 449000,
      stock: 28,
      image: 'https://images.unsplash.com/photo-1595225476933-0efea8521aba?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 2,
      name: 'Giày sneaker trắng',
      slug: 'giay-sneaker-trang-1',
      desc: 'Giày sneaker cổ điển, phù hợp mặc hàng ngày',
      price: 699000,
      originPrice: 999000,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 2,
      name: 'Giày boot da đen',
      slug: 'giay-boot-da-den-1',
      desc: 'Giày boot da cao cấp, sang trọng',
      price: 1299000,
      originPrice: 1799000,
      stock: 15,
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 2,
      name: 'Dép sandal mùa hè',
      slug: 'dep-sandal-mua-he-1',
      desc: 'Dép sandal thoáng khí, nhẹ nhàng',
      price: 149000,
      originPrice: 249000,
      stock: 60,
      image: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 2,
      name: 'Giày loafer da nâu',
      slug: 'giay-loafer-da-nau-1',
      desc: 'Giày loafer lịch lãm, phù hợp đi làm',
      price: 899000,
      originPrice: 1199000,
      stock: 12,
      image: 'https://images.unsplash.com/photo-1494456488529-cd4647f2f4b7?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 2,
      name: 'Giày thể thao chạy bộ',
      slug: 'giay-the-thao-chay-bo-1',
      desc: 'Giày chạy bộ nhẹ, hỗ trợ vận động',
      price: 799000,
      originPrice: 1099000,
      stock: 19,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 3,
      name: 'Mũ thời trang',
      slug: 'mu-thoi-trang-1',
      desc: 'Mũ baseball phong cách, chắn nắng',
      price: 99000,
      originPrice: 179000,
      stock: 70,
      image: 'https://images.unsplash.com/photo-1541642480938-7c393b90d1fa?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 3,
      name: 'Túi xách nữ',
      slug: 'tui-xach-nu-1',
      desc: 'Túi xách da cao cấp, tiện lợi',
      price: 899000,
      originPrice: 1299000,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 3,
      name: 'Khăn choàng lụa',
      slug: 'khan-choang-lua-1',
      desc: 'Khăn choàng lụa mềm mại, dễ kết hợp',
      price: 149000,
      originPrice: 249000,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1500336624523-d727130c3328?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 3,
      name: 'Thắt lưng da',
      slug: 'that-lung-da-1',
      desc: 'Thắt lưng da thật, phù hợp nhiều trang phục',
      price: 259000,
      originPrice: 349000,
      stock: 33,
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    },
    {
      categoryIndex: 3,
      name: 'Ví cầm tay',
      slug: 'vi-cam-tay-1',
      desc: 'Ví cầm tay nhỏ gọn, tiện mang theo',
      price: 189000,
      originPrice: 259000,
      stock: 41,
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const products = await Promise.all(
    productSeeds.map((productSeed) =>
      prisma.product.create({
        data: {
          categoryId: requireItem(categories, productSeed.categoryIndex, 'category').id,
          name: productSeed.name,
          slug: productSeed.slug,
          desc: productSeed.desc,
          price: productSeed.price,
          originPrice: productSeed.originPrice,
          stock: productSeed.stock,
          image: productSeed.image,
          isActive: true,
        },
      })
    )
  );

  console.log(`✓ Tạo ${products.length} sản phẩm`);

  const firstProduct = requireItem(products, 0, 'product');
  const secondProduct = requireItem(products, 1, 'product');
  const fourthProduct = requireItem(products, 3, 'product');

  // 5. Create Cart for user
  console.log('🛒 Tạo giỏ hàng...');

  const cart = await prisma.cart.create({
    data: {
      userId: requireItem(seededUsers, 0, 'seeded user').id,
    },
  });

  // Add items to cart
  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: firstProduct.id,
      quantity: 2,
    },
  });

  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: fourthProduct.id,
      quantity: 1,
    },
  });

  console.log('✓ Tạo giỏ hàng với 2 mặt hàng');

  // 6. Create Sample Orders
  console.log('📋 Tạo đơn hàng mẫu...');

  const order = await prisma.order.create({
    data: {
      userId: requireItem(seededUsers, 0, 'seeded user').id,
      status: 'CONFIRMED',
      totalPrice: firstProduct.price * 2 + secondProduct.price,
      shippingAddr: '123 Đường ABC, Phường 1, Quận 1, TP HCM',
      phoneNumber: '0987654321',
      note: 'Giao hàng nhanh nếu được',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: firstProduct.id,
      quantity: 2,
      price: firstProduct.price,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: secondProduct.id,
      quantity: 1,
      price: secondProduct.price,
    },
  });

  console.log(`✓ Tạo 1 đơn hàng với 2 mục`);

  // 7. Create Audit Logs
  console.log('📝 Tạo audit log...');

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'created',
      entity: 'user',
      entityId: requireItem(seededUsers, 0, 'seeded user').id,
      newValues: JSON.stringify({
        email: requireItem(seededUsers, 0, 'seeded user').email,
        fullName: requireItem(seededUsers, 0, 'seeded user').fullName,
      }),
    },
  });

  console.log('✓ Ghi nhận audit log');

  console.log('\n✨ Seed dữ liệu hoàn tất!');
  console.log('\n📊 Tóm tắt:');
  console.log(`  - ${paymentMethods.length} phương thức thanh toán`);
  console.log(`  - ${1 + seededUsers.length} tài khoản (1 admin, ${seededUsers.length} user)`);
  console.log(`  - 4 danh mục sản phẩm`);
  console.log(`  - ${products.length} sản phẩm`);
  console.log(`  - 1 giỏ hàng với 2 mục`);
  console.log(`  - 1 đơn hàng với 2 mục`);
  console.log(`  - 1 audit log`);
  console.log('\n🔑 Tài khoản test:');
  console.log(`  Admin: admin@ltwnc.tech / Admin@123`);
  console.log(`  User 1: user@ltwnc.tech / User@123`);
  console.log(`  User 2: user2@ltwnc.tech / User@123`);
  console.log(`  User 3: user3@ltwnc.tech / User@123`);
  console.log(`  User 4: user4@ltwnc.tech / User@123`);
  console.log(`  User 5: user5@ltwnc.tech / User@123`);
  console.log('\n💳 Phương thức thanh toán:');
  paymentMethods.forEach((pm) => {
    console.log(`  ${pm.icon} ${pm.name} (${pm.code}): ${pm.description}`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
