CREATE TABLE "categories" (
  "id" UUID NOT NULL, "parentId" UUID, "name" VARCHAR(160) NOT NULL, "slug" VARCHAR(160) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "products" (
  "id" UUID NOT NULL, "categoryId" UUID NOT NULL, "name" VARCHAR(200) NOT NULL, "slug" VARCHAR(200) NOT NULL,
  "description" TEXT NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "product_variants" (
  "id" UUID NOT NULL, "productId" UUID NOT NULL, "sku" VARCHAR(100) NOT NULL, "color" VARCHAR(80) NOT NULL, "material" VARCHAR(120) NOT NULL,
  "widthMm" INTEGER NOT NULL, "depthMm" INTEGER NOT NULL, "heightMm" INTEGER NOT NULL,
  "price" DECIMAL(18,0) NOT NULL, "stock" INTEGER NOT NULL DEFAULT 0, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "product_images" (
  "id" UUID NOT NULL, "productId" UUID NOT NULL, "variantId" UUID, "url" TEXT NOT NULL, "alt" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "collections" (
  "id" UUID NOT NULL, "name" TEXT NOT NULL, "slug" VARCHAR(160) NOT NULL, "description" TEXT NOT NULL, "imageUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "collection_products" (
  "collectionId" UUID NOT NULL, "productId" UUID NOT NULL,
  CONSTRAINT "collection_products_pkey" PRIMARY KEY ("collectionId","productId")
);
CREATE TABLE "banners" (
  "id" UUID NOT NULL, "title" TEXT NOT NULL, "imageUrl" TEXT NOT NULL, "targetUrl" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE INDEX "products_categoryId_isActive_idx" ON "products"("categoryId","isActive");
CREATE INDEX "products_isActive_createdAt_idx" ON "products"("isActive","createdAt");
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");
CREATE UNIQUE INDEX "product_variants_id_productId_key" ON "product_variants"("id","productId");
CREATE INDEX "product_variants_productId_isActive_price_idx" ON "product_variants"("productId","isActive","price");
CREATE INDEX "product_images_productId_sortOrder_idx" ON "product_images"("productId","sortOrder");
CREATE INDEX "product_images_variantId_productId_idx" ON "product_images"("variantId","productId");
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");
CREATE INDEX "collection_products_productId_idx" ON "collection_products"("productId");
CREATE INDEX "banners_isActive_sortOrder_idx" ON "banners"("isActive","sortOrder");
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_variantId_productId_fkey" FOREIGN KEY ("variantId","productId") REFERENCES "product_variants"("id","productId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
