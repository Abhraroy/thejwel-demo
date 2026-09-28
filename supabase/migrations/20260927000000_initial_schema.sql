-- =============================================================================
-- Migration: 20260927000000_initial_schema.sql
-- Description: Initial complete database schema with tables, extensions, enums,
--              triggers, RPC functions, indexes, and Row Level Security (RLS).
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;

-- =============================================================================
-- 2. CUSTOM TYPES & ENUMS
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promo_location') THEN
        CREATE TYPE public.promo_location AS ENUM ('promotion_banner', 'share_link');
    END IF;
END $$;

-- =============================================================================
-- 3. CORE TRIGGER & UTILITY FUNCTIONS
-- =============================================================================

-- Function: update_updated_at_column
-- Automatically sets updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: is_admin
-- Checks if current auth user is registered in admin_key
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_key WHERE admin = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- 4. BASE TABLES (NO FOREIGN DEPENDENCIES)
-- =============================================================================

-- 4.1 Users (Profiles linked 1-to-1 to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR UNIQUE,
    password_hash VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    phone_number VARCHAR UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 4.2 Admin Key (Stores admin privileges)
CREATE TABLE IF NOT EXISTS public.admin_key (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT,
    admin UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_key_admin ON public.admin_key(admin);

-- 4.3 Categories
CREATE TABLE IF NOT EXISTS public.categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL UNIQUE,
    description TEXT,
    category_image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

-- 4.4 Sub Categories
CREATE TABLE IF NOT EXISTS public.sub_categories (
    subcategory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(category_id) ON UPDATE CASCADE ON DELETE CASCADE,
    subcategory_name TEXT,
    subcategory_image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_sub_categories_updated_at
BEFORE UPDATE ON public.sub_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_sub_categories_category_id ON public.sub_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_is_active ON public.sub_categories(is_active);

-- 4.5 Styles
CREATE TABLE IF NOT EXISTS public.styles (
    style_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    style_name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    image_link TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_styles_updated_at
BEFORE UPDATE ON public.styles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_styles_active ON public.styles(is_active);
CREATE INDEX IF NOT EXISTS idx_styles_slug ON public.styles(slug);

-- 4.6 Occasions
CREATE TABLE IF NOT EXISTS public.occasions (
    occasion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occasion_name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    image_link TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_occasions_updated_at
BEFORE UPDATE ON public.occasions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_occasions_active ON public.occasions(is_active);
CREATE INDEX IF NOT EXISTS idx_occasions_slug ON public.occasions(slug);

-- 4.7 Collections
CREATE TABLE IF NOT EXISTS public.collections (
    collection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_active ON public.collections(is_active);

-- 4.8 Image Resources (Homepage banners and carousel links)
CREATE TABLE IF NOT EXISTS public.image_resources (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    image_link TEXT,
    section_name TEXT,
    redirect_route TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_resources_section_name ON public.image_resources(section_name);

-- 4.9 Promo Content (Announcements and share captions)
CREATE TABLE IF NOT EXISTS public.promo_content (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    place_to_be_displayed public.promo_location NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_promo_content_updated_at
BEFORE UPDATE ON public.promo_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_promo_content_location ON public.promo_content(place_to_be_displayed);

-- 4.10 Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
    coupon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_code VARCHAR NOT NULL UNIQUE,
    coupon_type TEXT DEFAULT 'PREPAID',
    description TEXT,
    discount_type VARCHAR CHECK (discount_type::TEXT = ANY (ARRAY['percentage'::TEXT, 'fixed'::TEXT])),
    discount_value NUMERIC NOT NULL,
    min_purchase_amount NUMERIC DEFAULT 0,
    max_discount_amount NUMERIC,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_coupon_code ON public.coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_active_validity ON public.coupons(is_active, valid_from, valid_until);

-- =============================================================================
-- 5. PRODUCTS & PRODUCT RELATIONS
-- =============================================================================

-- 5.1 Products
CREATE TABLE IF NOT EXISTS public.products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(category_id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES public.sub_categories(subcategory_id) ON UPDATE CASCADE ON DELETE CASCADE,
    style_id UUID REFERENCES public.styles(style_id) ON DELETE SET NULL,
    occasion_id UUID REFERENCES public.occasions(occasion_id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    description TEXT,
    base_price NUMERIC(10, 2),
    discount_percentage NUMERIC(5, 2) DEFAULT 0,
    final_price NUMERIC(10, 2),
    stock_quantity INTEGER DEFAULT 0,
    weight_grams NUMERIC(8, 2),
    thumbnail_image TEXT,
    size TEXT[],
    tags TEXT[],
    listed_status BOOLEAN DEFAULT FALSE,
    sku TEXT UNIQUE,
    home_visibility BOOLEAN NOT NULL DEFAULT TRUE,
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search trigger function
CREATE OR REPLACE FUNCTION public.products_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.product_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.sku, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_update
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.products_search_trigger();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_style_id ON public.products(style_id);
CREATE INDEX IF NOT EXISTS idx_products_occasion_id ON public.products(occasion_id);
CREATE INDEX IF NOT EXISTS idx_products_listed_status ON public.products(listed_status);
CREATE INDEX IF NOT EXISTS idx_products_home_visibility ON public.products(home_visibility);
CREATE INDEX IF NOT EXISTS products_name_trgm ON public.products USING GIN (product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS product_search_vector_idx ON public.products USING GIN (search_vector);

-- 5.2 Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- 5.3 Product Collections (Many-to-Many Join Table)
CREATE TABLE IF NOT EXISTS public.product_collections (
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES public.collections(collection_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_collections_pkey PRIMARY KEY (product_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_product_collections_product_id ON public.product_collections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_collections_collection_id ON public.product_collections(collection_id);

-- =============================================================================
-- 6. USER-SPECIFIC ENTITIES (ADDRESSES, CARTS, WISHLISTS, ORDERS)
-- =============================================================================

-- 6.1 Addresses
CREATE TABLE IF NOT EXISTS public.addresses (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    address_type VARCHAR CHECK (address_type::TEXT = ANY (ARRAY['billing'::TEXT, 'shipping'::TEXT])),
    street_address TEXT NOT NULL,
    city VARCHAR NOT NULL,
    state VARCHAR NOT NULL,
    postal_code VARCHAR NOT NULL,
    country VARCHAR NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    address_line1 TEXT,
    address_line2 TEXT,
    house_no TEXT,
    landmark TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- 6.2 Cart
CREATE TABLE IF NOT EXISTS public.cart (
    cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_cart_updated_at
BEFORE UPDATE ON public.cart
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart(user_id);

-- 6.3 Cart Items
CREATE TABLE IF NOT EXISTS public.cart_items (
    cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.cart(cart_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    size TEXT,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT cart_items_cart_id_product_id_key UNIQUE (cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- 6.4 Wishlist
CREATE TABLE IF NOT EXISTS public.wishlist (
    wishlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);

-- 6.5 Wishlist Items
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    wishlist_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES public.wishlist(wishlist_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT wishlist_items_wishlist_id_product_id_key UNIQUE (wishlist_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON public.wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON public.wishlist_items(product_id);

-- 6.6 Orders
CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    order_number VARCHAR UNIQUE,
    order_status VARCHAR DEFAULT 'pending',
    payment_status VARCHAR NOT NULL DEFAULT 'pending',
    subtotal NUMERIC DEFAULT 0,
    shipping_cost NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    shipping_address_id UUID REFERENCES public.addresses(address_id) ON DELETE SET NULL,
    address_text TEXT,
    coupon_code VARCHAR,
    transaction_id VARCHAR,
    order_date TIMESTAMPTZ DEFAULT NOW(),
    shipped_date TIMESTAMPTZ,
    delivered_date TIMESTAMPTZ,
    lock_order BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON public.orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_address_id ON public.orders(shipping_address_id);

-- 6.7 Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(product_id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    ordered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 6.8 Payments
CREATE TABLE IF NOT EXISTS public.payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    payment_method VARCHAR NOT NULL,
    transaction_id VARCHAR,
    amount NUMERIC NOT NULL,
    payment_status VARCHAR DEFAULT 'pending',
    payment_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);

-- 6.9 Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR,
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- 6.10 Review Images
CREATE TABLE IF NOT EXISTS public.review_images (
    review_image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(review_id) ON DELETE CASCADE,
    review_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON public.review_images(review_id);

-- =============================================================================
-- 7. RPC FUNCTIONS
-- =============================================================================

-- 7.1 RPC: product_search_vector_func
-- Used in Navbar search dropdown and /search/[product_arg] page
CREATE OR REPLACE FUNCTION public.product_search_vector_func(
    q TEXT,
    result_limit INTEGER DEFAULT 20
)
RETURNS SETOF public.products AS $$
DECLARE
    search_query TSQUERY;
    clean_q TEXT;
BEGIN
    clean_q := trim(COALESCE(q, ''));
    IF clean_q = '' THEN
        RETURN;
    END IF;

    search_query := websearch_to_tsquery('english', clean_q);

    RETURN QUERY
    SELECT p.*
    FROM public.products p
    WHERE p.listed_status = TRUE
      AND (
          p.search_vector @@ search_query
          OR p.product_name ILIKE ('%' || clean_q || '%')
          OR p.sku ILIKE ('%' || clean_q || '%')
          OR p.description ILIKE ('%' || clean_q || '%')
      )
    ORDER BY
        ts_rank(p.search_vector, search_query) DESC,
        p.updated_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7.2 RPC: get_recommended_products
-- Used on /product/[product_id] and /product/[product_id]/recommended page
CREATE OR REPLACE FUNCTION public.get_recommended_products(
    current_product_id UUID,
    result_limit INTEGER DEFAULT 8
)
RETURNS SETOF public.products AS $$
DECLARE
    curr_category_id UUID;
    curr_style_id UUID;
    curr_occasion_id UUID;
    curr_subcategory_id UUID;
BEGIN
    SELECT category_id, style_id, occasion_id, subcategory_id
    INTO curr_category_id, curr_style_id, curr_occasion_id, curr_subcategory_id
    FROM public.products
    WHERE product_id = current_product_id;

    RETURN QUERY
    SELECT p.*
    FROM public.products p
    WHERE p.product_id != current_product_id
      AND p.listed_status = TRUE
    ORDER BY
        (
            (CASE WHEN curr_subcategory_id IS NOT NULL AND p.subcategory_id = curr_subcategory_id THEN 4 ELSE 0 END) +
            (CASE WHEN curr_category_id IS NOT NULL AND p.category_id = curr_category_id THEN 3 ELSE 0 END) +
            (CASE WHEN curr_style_id IS NOT NULL AND p.style_id = curr_style_id THEN 2 ELSE 0 END) +
            (CASE WHEN curr_occasion_id IS NOT NULL AND p.occasion_id = curr_occasion_id THEN 1 ELSE 0 END)
        ) DESC,
        p.created_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_key ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

-- 8.1 Users
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 8.2 Admin Key
CREATE POLICY "Admins can view admin keys"
    ON public.admin_key FOR SELECT
    USING (auth.uid() = admin);

CREATE POLICY "Admins can insert admin keys"
    ON public.admin_key FOR INSERT
    WITH CHECK (auth.uid() = admin);

-- 8.3 Public Read Tables (Catalog & Marketing)
-- Categories
CREATE POLICY "Public can view active categories"
    ON public.categories FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    USING (public.is_admin());

-- Sub Categories
CREATE POLICY "Public can view active subcategories"
    ON public.sub_categories FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage subcategories"
    ON public.sub_categories FOR ALL
    USING (public.is_admin());

-- Styles
CREATE POLICY "Public can view active styles"
    ON public.styles FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage styles"
    ON public.styles FOR ALL
    USING (public.is_admin());

-- Occasions
CREATE POLICY "Public can view active occasions"
    ON public.occasions FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage occasions"
    ON public.occasions FOR ALL
    USING (public.is_admin());

-- Collections
CREATE POLICY "Public can view active collections"
    ON public.collections FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage collections"
    ON public.collections FOR ALL
    USING (public.is_admin());

-- Image Resources
CREATE POLICY "Public can view image resources"
    ON public.image_resources FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage image resources"
    ON public.image_resources FOR ALL
    USING (public.is_admin());

-- Promo Content
CREATE POLICY "Public can view promo content"
    ON public.promo_content FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage promo content"
    ON public.promo_content FOR ALL
    USING (public.is_admin());

-- Coupons
CREATE POLICY "Public can view active coupons"
    ON public.coupons FOR SELECT
    USING ((is_active = TRUE AND valid_from <= NOW() AND valid_until >= NOW()) OR public.is_admin());

CREATE POLICY "Admins can manage coupons"
    ON public.coupons FOR ALL
    USING (public.is_admin());

-- Products
CREATE POLICY "Public can view listed products"
    ON public.products FOR SELECT
    USING (listed_status = TRUE OR public.is_admin());

CREATE POLICY "Admins can manage products"
    ON public.products FOR ALL
    USING (public.is_admin());

-- Product Images
CREATE POLICY "Public can view product images"
    ON public.product_images FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage product images"
    ON public.product_images FOR ALL
    USING (public.is_admin());

-- Product Collections
CREATE POLICY "Public can view product collections"
    ON public.product_collections FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage product collections"
    ON public.product_collections FOR ALL
    USING (public.is_admin());

-- 8.4 User Data: Addresses
CREATE POLICY "Users can view own addresses"
    ON public.addresses FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own addresses"
    ON public.addresses FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own addresses"
    ON public.addresses FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own addresses"
    ON public.addresses FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());

-- 8.5 Cart & Cart Items
CREATE POLICY "Users can view own cart"
    ON public.cart FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own cart"
    ON public.cart FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own cart"
    ON public.cart FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own cart"
    ON public.cart FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own cart items"
    ON public.cart_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.cart
            WHERE cart.cart_id = cart_items.cart_id
              AND (cart.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Users can insert own cart items"
    ON public.cart_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cart
            WHERE cart.cart_id = cart_items.cart_id
              AND (cart.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Users can update own cart items"
    ON public.cart_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.cart
            WHERE cart.cart_id = cart_items.cart_id
              AND (cart.user_id = auth.uid() OR public.is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cart
            WHERE cart.cart_id = cart_items.cart_id
              AND (cart.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Users can delete own cart items"
    ON public.cart_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.cart
            WHERE cart.cart_id = cart_items.cart_id
              AND (cart.user_id = auth.uid() OR public.is_admin())
        )
    );

-- 8.6 Wishlist & Wishlist Items
CREATE POLICY "Users can view own wishlist"
    ON public.wishlist FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own wishlist"
    ON public.wishlist FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own wishlist"
    ON public.wishlist FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own wishlist items"
    ON public.wishlist_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.wishlist
            WHERE wishlist.wishlist_id = wishlist_items.wishlist_id
              AND (wishlist.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Users can insert own wishlist items"
    ON public.wishlist_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wishlist
            WHERE wishlist.wishlist_id = wishlist_items.wishlist_id
              AND (wishlist.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Users can delete own wishlist items"
    ON public.wishlist_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.wishlist
            WHERE wishlist.wishlist_id = wishlist_items.wishlist_id
              AND (wishlist.user_id = auth.uid() OR public.is_admin())
        )
    );

-- 8.7 Orders & Order Items
-- Note: Order insertions and status updates are executed server-side using service_role.
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage all orders"
    ON public.orders FOR ALL
    USING (public.is_admin());

CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.order_id = order_items.order_id
              AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Admins can manage all order items"
    ON public.order_items FOR ALL
    USING (public.is_admin());

-- 8.8 Payments
CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.order_id = payments.order_id
              AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Admins can manage all payments"
    ON public.payments FOR ALL
    USING (public.is_admin());

-- 8.9 Reviews & Review Images
CREATE POLICY "Public can view reviews"
    ON public.reviews FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can create reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Public can view review images"
    ON public.review_images FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can insert images for own reviews"
    ON public.review_images FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.reviews
            WHERE reviews.review_id = review_images.review_id
              AND (reviews.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Users can delete images for own reviews"
    ON public.review_images FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.reviews
            WHERE reviews.review_id = review_images.review_id
              AND (reviews.user_id = auth.uid() OR public.is_admin())
        )
    );

-- =============================================================================
-- 9. PUBLIC VIEWS (FOR REVIEWS DISPLAY WITHOUT EXPOSING SENSITIVE DATA)
-- =============================================================================

-- View to securely display reviewer names publicly without exposing phone numbers or emails
CREATE OR REPLACE VIEW public.public_reviewer_profiles WITH (security_invoker = FALSE) AS
SELECT user_id, first_name, last_name
FROM public.users;

GRANT SELECT ON public.public_reviewer_profiles TO anon, authenticated;
