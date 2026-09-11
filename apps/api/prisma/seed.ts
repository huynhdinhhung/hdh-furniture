import { db } from '../src/db.js';

const hero = 'https://images.pexels.com/photos/10486238/pexels-photo-10486238.jpeg?cs=srgb&fm=jpg';
const sofa = 'https://images.pexels.com/photos/7018400/pexels-photo-7018400.jpeg?cs=srgb&fm=jpg';
const chair = 'https://images.pexels.com/photos/16028536/pexels-photo-16028536.jpeg?cs=srgb&fm=jpg';
const table = 'https://images.pexels.com/photos/11112740/pexels-photo-11112740.jpeg?cs=srgb&fm=jpg';

// Stable natural keys and empty updates preserve later edits, prices and stock.
async function seed() {
  const living = await db.category.upsert({ where: { slug: 'phong-khach' }, update: {}, create: { slug: 'phong-khach', name: 'Phòng khách' } });
  const dining = await db.category.upsert({ where: { slug: 'phong-an' }, update: {}, create: { slug: 'phong-an', name: 'Phòng ăn' } });
  const sofaCategory = await db.category.upsert({ where: { slug: 'sofa' }, update: {}, create: { slug: 'sofa', name: 'Sofa', parentId: living.id } });
  const chairs = await db.category.upsert({ where: { slug: 'ghe' }, update: {}, create: { slug: 'ghe', name: 'Ghế', parentId: dining.id } });
  const tables = await db.category.upsert({ where: { slug: 'ban' }, update: {}, create: { slug: 'ban', name: 'Bàn', parentId: dining.id } });
  const samples = [
    { slug: 'sofa-an-nhien', name: 'Sofa An Nhiên', categoryId: sofaCategory.id, image: sofa, price: '18900000', material: 'Vải', color: 'Kem', dims: [2200, 900, 800] },
    { slug: 'ghe-moc', name: 'Ghế Mộc', categoryId: chairs.id, image: chair, price: '2900000', material: 'Gỗ sồi', color: 'Nâu', dims: [480, 520, 800] },
    { slug: 'ban-an-sum-vay', name: 'Bàn ăn Sum Vầy', categoryId: tables.id, image: table, price: '8900000', material: 'Gỗ sồi', color: 'Tự nhiên', dims: [1600, 800, 750] },
    { slug: 'sofa-binh-yen', name: 'Sofa Bình Yên', categoryId: sofaCategory.id, image: sofa, price: '14900000', material: 'Vải', color: 'Kem', dims: [1900, 850, 800] },
    { slug: 'ghe-thu-thai', name: 'Ghế Thư Thái', categoryId: chairs.id, image: chair, price: '3500000', material: 'Gỗ sồi', color: 'Tự nhiên', dims: [500, 520, 820] },
    { slug: 'ban-tra-nang', name: 'Bàn trà Nắng', categoryId: living.id, image: table, price: '4900000', material: 'Gỗ sồi', color: 'Nâu', dims: [1000, 600, 420] },
    { slug: 'sofa-may', name: 'Sofa Mây', categoryId: sofaCategory.id, image: sofa, price: '21900000', material: 'Vải', color: 'Xám', dims: [2400, 950, 800] },
    { slug: 'ban-ben-hien', name: 'Bàn bên Hiên', categoryId: living.id, image: table, price: '1900000', material: 'Gỗ sồi', color: 'Tự nhiên', dims: [450, 450, 500] },
  ];
  const collection = await db.collection.upsert({ where: { slug: 'song-cham' }, update: {}, create: { slug: 'song-cham', name: 'Sống chậm', description: 'Tông màu tự nhiên và đường nét nhẹ nhàng cho một góc thư giãn.', imageUrl: hero } });
  const warm = await db.collection.upsert({ where: { slug: 'am-cung' }, update: {}, create: { slug: 'am-cung', name: 'Chuyện nhà ấm cúng', description: 'Gỗ mộc và những món đồ dễ kết hợp quanh bàn ăn gia đình.', imageUrl: chair } });
  for (const [index, item] of samples.entries()) {
    await db.$transaction(async tx => {
      const product = await tx.product.upsert({ where: { slug: item.slug }, update: {}, create: {
        slug: item.slug, name: item.name, categoryId: item.categoryId,
        description: 'Thiết kế mẫu Hưng Furniture với đường nét tinh giản, phù hợp không gian sống hiện đại.\nSản phẩm, giá và thông số là dữ liệu giả phục vụ phát triển. Ảnh Pexels chỉ minh họa phong cách, không đại diện sản phẩm thực tế.',
      } });
      for (let option = 0; option < 2; option++) {
        const sku = 'DEMO-' + item.slug.toUpperCase() + '-' + (option + 1);
        const variant = await tx.productVariant.upsert({ where: { sku }, update: {}, create: {
          productId: product.id, sku, color: option ? 'Xám' : item.color, material: item.material,
          price: (BigInt(item.price) + BigInt(option) * 500000n).toString(), stock: option ? 0 : 8 + index,
          widthMm: item.dims[0], depthMm: item.dims[1], heightMm: item.dims[2],
        } });
        const imageId = '10000000-0000-4000-8000-' + String(index * 2 + option + 1).padStart(12, '0');
        await tx.productImage.upsert({ where: { id: imageId }, update: {}, create: { id: imageId, productId: product.id, variantId: variant.id, url: option ? hero : item.image, alt: item.name + ' — ảnh minh họa Pexels, lựa chọn ' + (option + 1), sortOrder: option } });
      }
      const collectionId = index % 2 ? warm.id : collection.id;
      const roomImageId = '10000000-0000-4000-8000-' + String(101 + index).padStart(12, '0');
      await tx.productImage.upsert({ where: { id: roomImageId }, update: {}, create: { id: roomImageId, productId: product.id, url: hero, alt: 'Gợi ý không gian — ảnh minh họa Pexels', sortOrder: 3 } });
      await tx.collectionProduct.upsert({ where: { collectionId_productId: { collectionId, productId: product.id } }, update: {}, create: { collectionId, productId: product.id } });
    });
  }
  await db.banner.upsert({ where: { id: '20000000-0000-4000-8000-000000000001' }, update: {}, create: { id: '20000000-0000-4000-8000-000000000001', title: 'Nhà là nơi mình thuộc về.', imageUrl: hero, targetUrl: '/san-pham', sortOrder: 0 } });
  console.log('Đã seed catalog mẫu an toàn; không ghi đè dữ liệu đã tồn tại.');
}
seed().catch(() => { console.error('Seed thất bại. Kiểm tra kết nối, migration và quyền database.'); process.exitCode = 1; }).finally(() => db.$disconnect());
