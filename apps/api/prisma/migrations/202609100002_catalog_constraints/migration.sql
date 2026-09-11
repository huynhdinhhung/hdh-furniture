ALTER TABLE product_variants
  ADD CONSTRAINT variant_price_nonnegative CHECK (price >= 0),
  ADD CONSTRAINT variant_stock_nonnegative CHECK (stock >= 0),
  ADD CONSTRAINT variant_dimensions_positive CHECK ("widthMm" > 0 AND "depthMm" > 0 AND "heightMm" > 0);
ALTER TABLE product_images ADD CONSTRAINT image_sort_nonnegative CHECK ("sortOrder" >= 0);
ALTER TABLE banners ADD CONSTRAINT banner_sort_nonnegative CHECK ("sortOrder" >= 0);
ALTER TABLE categories ADD CONSTRAINT category_not_own_parent CHECK ("parentId" IS DISTINCT FROM id);

CREATE FUNCTION prevent_category_cycle() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Serialize hierarchy writes; catalog is small and modified infrequently.
  PERFORM pg_advisory_xact_lock(684216731);
  IF NEW."parentId" IS NOT NULL AND EXISTS (
    WITH RECURSIVE ancestors AS (
      SELECT id, "parentId" FROM categories WHERE id = NEW."parentId"
      UNION
      SELECT c.id, c."parentId" FROM categories c JOIN ancestors a ON c.id = a."parentId"
    ) SELECT 1 FROM ancestors WHERE id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Category hierarchy cannot contain cycles' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER category_cycle_guard BEFORE INSERT OR UPDATE OF "parentId" ON categories
FOR EACH ROW EXECUTE FUNCTION prevent_category_cycle();
