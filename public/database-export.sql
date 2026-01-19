-- ============================================
-- COMPLETE DATABASE EXPORT
-- Generated: 2026-01-19
-- ============================================

-- ============================================
-- 1. CREATE ENUM TYPES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'sales_manager', 'project_manager', 'accountant', 'viewer');

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Companies Table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  logo_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT
);

-- Delivery Orders Table
CREATE TABLE public.delivery_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivery_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  notes TEXT,
  company_id TEXT
);

-- Invoices Table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 5,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invoice_number TEXT NOT NULL,
  company_id TEXT,
  client_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'::text,
  notes TEXT
);

-- Products Table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'lighting'::text,
  color TEXT,
  unit TEXT NOT NULL DEFAULT 'piece'::text,
  company_id TEXT
);

-- Profiles Table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT
);

-- Projects Table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  contractor JSONB NOT NULL DEFAULT '{}'::jsonb,
  client JSONB NOT NULL DEFAULT '{}'::jsonb,
  consultant JSONB,
  timeline JSONB NOT NULL DEFAULT '{"endDate": "", "startDate": "", "milestones": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID,
  developer JSONB,
  sales_manager_contact TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lead'::text,
  sales_manager TEXT,
  buyer_trn TEXT,
  attn_to TEXT,
  client_email TEXT,
  client_contact TEXT
);

-- Quotations Table
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount JSONB DEFAULT '{"type": "percentage", "value": 0}'::jsonb,
  tax JSONB DEFAULT '{"rate": 5, "type": "VAT"}'::jsonb,
  total NUMERIC NOT NULL DEFAULT 0,
  valid_until DATE,
  project_id UUID,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID,
  project_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'::text
);

-- Settings Table
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  key TEXT NOT NULL
);

-- User Roles Table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'viewer'::app_role,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 3. CREATE DATABASE FUNCTIONS
-- ============================================

-- Handle new user function (creates profile and assigns default role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), NEW.email);
  
  -- Default role is viewer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  
  RETURN NEW;
END;
$function$;

-- Has role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$function$;

-- Update updated_at column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- ============================================
-- 4. CREATE TRIGGERS
-- ============================================

-- Trigger for new user signup (attach to auth.users)
-- Note: Run this after creating the trigger function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES
-- ============================================

-- Companies Policies
CREATE POLICY "Users can view their own companies" ON public.companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own companies" ON public.companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own companies" ON public.companies FOR DELETE USING (auth.uid() = user_id);

-- Delivery Orders Policies
CREATE POLICY "Users can view their own delivery orders" ON public.delivery_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create delivery orders" ON public.delivery_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own delivery orders" ON public.delivery_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own delivery orders" ON public.delivery_orders FOR DELETE USING (auth.uid() = user_id);

-- Invoices Policies
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- Products Policies
CREATE POLICY "Users can view their own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Projects Policies
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all projects" ON public.projects FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update all projects" ON public.projects FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete all projects" ON public.projects FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Quotations Policies
CREATE POLICY "Users can view their own quotations" ON public.quotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create quotations" ON public.quotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotations" ON public.quotations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quotations" ON public.quotations FOR DELETE USING (auth.uid() = user_id);

-- Settings Policies
CREATE POLICY "Users can view their own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON public.settings FOR DELETE USING (auth.uid() = user_id);

-- User Roles Policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete user_roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update any user_role" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 7. INSERT DATA
-- ============================================

-- NOTE: Before inserting data, you need to create users in auth.users first.
-- The user_id references below point to existing users.
-- You may need to update these UUIDs to match your new Supabase project's user IDs.

-- Companies Data
INSERT INTO public.companies (id, user_id, is_default, created_at, updated_at, name, email, phone, address, website) VALUES
('a06d3e31-62a2-4ce8-875e-2dc473952aa9', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', false, '2025-12-24 09:51:50.594997+00', '2026-01-07 10:59:47.501499+00', 'Alhadaf Projects', 'Info@AlhadafProjects.com', '+971 507822916', 'Buliding Rema plaza | Office no. 1 Aljurf 3 Ajman UAE.', 'www.alhadafprojects.com');

-- Delivery Orders Data
INSERT INTO public.delivery_orders (id, user_id, project_id, items, delivery_date, created_at, updated_at, delivery_number, status, notes, company_id) VALUES
('db383cb5-2324-43a2-96a0-e0b5f693c98d', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', 'a36b52fa-d7c2-442c-a58a-fe7eecde26ad', '[{"id": "item-1767695426183", "unit": "pcs", "quantity": 10, "productName": "tile trims", "deliveredQuantity": 5}]', '2026-01-15', '2026-01-06 10:31:25.893904+00', '2026-01-06 10:31:36.403652+00', 'DO-202601-806', 'delivered', NULL, NULL);

-- Products Data
INSERT INTO public.products (id, user_id, price, cost, stock_quantity, reorder_level, created_at, updated_at, name, sku, description, category, color, unit, company_id) VALUES
('46ea6c8c-3e0c-455a-8cd4-4d945aad8d24', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', 1000, 8000, 20, 10, '2025-12-12 07:38:07.396831+00', '2025-12-16 13:11:13.39737+00', 'Tiles trims', '1', 'tile trims', 'lighting', 'red', 'sqm', NULL),
('d3767b6e-f3c7-4529-b48f-1a7ee684a391', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', 945, 1000, 20, 0, '2025-12-16 13:03:15.468426+00', '2025-12-16 13:11:26.294324+00', 'Tiles trims', '1', 'gfsdgsdgdsgdfgb  dfgsgsdfg  ', 'Aluminium', 'grey', 'LM', NULL),
('582b9903-854c-49c6-91fb-e7def01ee07d', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', 444, 221, 10, 10, '2026-01-07 06:40:09.428696+00', '2026-01-07 06:41:08.504817+00', 'Mardan', '1', '', 'lighting', 'red', 'piece', 'target-specialties'),
('d2873912-d9e6-4b6b-b9b9-d122df6a9274', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', 1000, 100, 100, 10, '2026-01-07 07:48:08.500514+00', '2026-01-07 07:48:08.500514+00', 'Mardan', '5', '', 'lighting', 'grey', 'piece', 'a06d3e31-62a2-4ce8-875e-2dc473952aa9');

-- Profiles Data (Note: These are created automatically by the handle_new_user trigger)
-- You may need to manually insert these after creating users
INSERT INTO public.profiles (id, user_id, created_at, updated_at, full_name, avatar_url, email) VALUES
('628a7235-5028-4cd3-8b20-8ff891ae9ec6', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', '2025-12-06 03:45:19.519057+00', '2025-12-06 03:45:19.519057+00', 'Shah Faisal', NULL, NULL),
('5144a427-f41b-4303-a15a-719531c9324e', '1ac29930-3a7a-4cc1-95e0-5b12c6654cd6', '2026-01-01 10:41:41.747285+00', '2026-01-01 10:41:41.747285+00', 'Kamran Ullah', NULL, NULL);

-- Projects Data
INSERT INTO public.projects (id, user_id, value, contractor, client, consultant, timeline, created_at, updated_at, company_id, developer, sales_manager_contact, name, category, status, sales_manager, buyer_trn, attn_to, client_email, client_contact) VALUES
('a36b52fa-d7c2-442c-a58a-fe7eecde26ad', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', 2021, '{"id": "CONT-1765265450583", "name": "Shah Faisal", "email": "shahfaisal5714@gmail.com", "phone": "+923028057604", "contact": "Shah Faisal"}', '{}', NULL, '{"endDate": "2026-01-07", "startDate": "2025-12-07", "milestones": []}', '2025-12-09 07:30:51.44859+00', '2025-12-12 07:12:59.645573+00', NULL, NULL, NULL, 'Adil bakht', 'commercial', 'lead', 'John Smith', NULL, NULL, NULL, NULL),
('d5c08239-6e59-481d-a50f-20b707958f48', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', 2000, '{"id": "CONT-1765525136859", "name": "Al Futtaim Contractors", "email": "khalid@alfuttaim.ae", "phone": "3028057604", "contact": "6+656+"}', '{}', NULL, '{"endDate": "2025-12-24", "startDate": "2025-12-18", "milestones": []}', '2025-12-12 07:38:57.266972+00', '2025-12-12 07:38:57.266972+00', NULL, NULL, NULL, 'Mardan', 'industrial', 'lead', 'khan', NULL, NULL, NULL, NULL),
('0a698926-0b52-49bd-8d01-2e738307acfd', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', 0, '{"id": "CONT-1767697914235", "name": "Al Futtaim Contractors", "email": "shahfaisal5714@gmail.com", "phone": "5564654654", "contact": "jhgkjhkjh"}', '{"id": "CLI-1767697914235", "name": "Al Futtaim Contractors", "email": "shahfaisal5714@gmail.com", "phone": "5564654654", "contact": "jhgkjhkjh"}', '{"id": "CONS-1767697914235", "name": "khan", "email": "", "phone": "", "contact": ""}', '{"endDate": "", "startDate": "", "milestones": []}', '2026-01-06 11:11:55.202786+00', '2026-01-06 11:11:55.202786+00', NULL, '{"name": "hhjghjgk"}', '543524654684', 'Tiles trims', 'commercial', 'lead', 'Emily Davis', '54656465', 'jhgkjhkjh', 'shahfaisal5714@gmail.com', '5564654654'),
('d9ec4eed-fb04-4b27-866f-2920c7b809c6', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', 0, '{"id": "CONT-1767772043580", "name": "Al Futtaim Contractors", "email": "shahfaisal5714@gmail.com", "phone": "5564654654", "contact": "jhgkjhkjh"}', '{"id": "CLI-1767772043580", "name": "Al Futtaim Contractors", "email": "shahfaisal5714@gmail.com", "phone": "5564654654", "contact": "jhgkjhkjh"}', '{"id": "CONS-1767772043580", "name": "khan", "email": "", "phone": "", "contact": ""}', '{"endDate": "", "startDate": "", "milestones": []}', '2026-01-07 07:47:24.508264+00', '2026-01-07 07:47:24.508264+00', 'a06d3e31-62a2-4ce8-875e-2dc473952aa9', '{"name": "hhjghjgk"}', '543524654684', 'Tiles trims', 'commercial', 'lead', '5646', '54656465', 'jhgkjhkjh', 'shahfaisal5714@gmail.com', '5564654654'),
('ab31c313-8913-466b-9762-917308e8cbf3', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', 0, '{"id": "CONT-1767783665669", "name": "NRTC ", "email": "abdullah@alhadafprojects.com", "phone": "+971506259267", "contact": "Saad Hanif"}', '{"id": "CLI-1767783665669", "name": "NRTC ", "email": "abdullah@alhadafprojects.com", "phone": "+971506259267", "contact": "Saad Hanif"}', '{"id": "CONS-1767783665669", "name": "abc", "email": "", "phone": "", "contact": ""}', '{"endDate": "", "startDate": "", "milestones": []}', '2026-01-07 11:01:09.01114+00', '2026-01-07 11:01:09.01114+00', NULL, '{"name": "abc"}', '+971 50 2307822', 'NRTC Office Building', 'commercial', 'lead', 'Abdullah Khan', '1234567890', 'Saad Hanif', 'abdullah@alhadafprojects.com', '+971506259267');

-- Quotations Data
INSERT INTO public.quotations (id, user_id, items, subtotal, discount, tax, total, valid_until, project_id, version, created_at, updated_at, company_id, project_name, status) VALUES
('8301a184-6649-401e-a786-cbddfaa2a718', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', '[{"unit": "sqm", "total": 424.15000000000003, "margin": 25, "category": "wpc_decking", "quantity": 4.99, "productId": "P-003", "unitPrice": 85, "productName": "WPC Decking - Teak"}]', 424.15, '{"type": "percentage", "value": 5}', '{"rate": 5, "type": "VAT"}', 423.09, '2026-01-11', 'a36b52fa-d7c2-442c-a58a-fe7eecde26ad', 1, '2025-12-12 07:12:38.692334+00', '2025-12-12 07:12:38.692334+00', NULL, 'Zoya bakht', 'draft'),
('001dec7a-3b29-4f5d-9ced-0f8eef0358dc', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', '[{"unit": "sqm", "total": 425, "margin": 25, "category": "wpc_decking", "quantity": 5, "productId": "P-003", "unitPrice": 85, "productName": "WPC Decking - Teak"}]', 425, '{"type": "percentage", "value": 0}', '{"rate": 5, "type": "VAT"}', 446.25, '2026-01-11', 'a36b52fa-d7c2-442c-a58a-fe7eecde26ad', 1, '2025-12-12 07:13:25.721202+00', '2025-12-12 07:13:25.721202+00', NULL, 'Adil bakht', 'draft'),
('795c22fd-5bca-4500-ada2-eaf635fc7b82', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', '[{"unit": "sqm", "total": 5000, "margin": 25, "category": "lighting", "quantity": 5, "productId": "46ea6c8c-3e0c-455a-8cd4-4d945aad8d24", "unitPrice": 1000, "productName": "Tile trims"}]', 5000, '{"type": "percentage", "value": 5}', '{"rate": 5, "type": "VAT"}', 4987.5, '2026-01-11', 'd5c08239-6e59-481d-a50f-20b707958f48', 1, '2025-12-12 07:41:40.346767+00', '2025-12-12 07:41:40.346767+00', NULL, 'Mardan', 'draft'),
('85e33702-42a5-4837-aa91-3e21cf61bc6e', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', '[{"unit": "sqm", "total": 2000, "margin": 25, "category": "lighting", "quantity": 2, "productId": "46ea6c8c-3e0c-455a-8cd4-4d945aad8d24", "unitPrice": 1000, "productName": "Tile trims"}]', 2000, '{"type": "percentage", "value": 0}', '{"rate": 5, "type": "VAT"}', 2100, '2026-01-11', 'd5c08239-6e59-481d-a50f-20b707958f48', 1, '2025-12-12 09:40:32.822816+00', '2025-12-12 09:40:32.822816+00', NULL, 'Mardan', 'draft'),
('47f97707-9b08-4d84-abd7-761f78675df6', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', '[{"unit": "sqm", "total": 1500, "margin": 25, "category": "lighting", "quantity": 100, "productId": "46ea6c8c-3e0c-455a-8cd4-4d945aad8d24", "unitPrice": 15, "productName": "Tile trims"}]', 1500, '{"type": "percentage", "value": 0}', '{"rate": 5, "type": "VAT"}', 1575, '2026-01-14', 'a36b52fa-d7c2-442c-a58a-fe7eecde26ad', 1, '2025-12-15 06:03:49.813228+00', '2025-12-15 06:03:49.813228+00', NULL, 'Adil bakht', 'draft'),
('3af89730-d83a-4d2e-aee4-2579289b0748', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', '[{"unit": "LM", "total": 4725, "margin": 25, "category": "Aluminium", "quantity": 5, "productId": "d3767b6e-f3c7-4529-b48f-1a7ee684a391", "unitPrice": 945, "productName": "Tiles trims"}]', 4725, '{"type": "percentage", "value": 5}', '{"rate": 5, "type": "VAT"}', 4713.19, '2026-01-15', 'd5c08239-6e59-481d-a50f-20b707958f48', 1, '2025-12-16 13:04:36.179011+00', '2025-12-16 13:04:36.179011+00', NULL, 'Mardan', 'draft'),
('8522ff63-e98e-4664-a347-07d3d8cc45c5', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', '[{"unit": "sqm", "total": 5000, "margin": 25, "category": "lighting", "quantity": 5, "productId": "46ea6c8c-3e0c-455a-8cd4-4d945aad8d24", "unitPrice": 1000, "productName": "Tiles trims"}]', 5000, '{"type": "percentage", "value": 0}', '{"rate": 5, "type": "VAT"}', 5250, '2026-01-23', 'd5c08239-6e59-481d-a50f-20b707958f48', 1, '2025-12-24 09:52:26.419427+00', '2025-12-24 09:52:26.419427+00', NULL, 'Mardan', 'draft'),
('6cdf9fb1-ac33-45f7-bd3f-7ed9eedb4d15', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', '[{"unit": "LM", "total": 4725, "margin": 25, "category": "Aluminium", "quantity": 5, "productId": "d3767b6e-f3c7-4529-b48f-1a7ee684a391", "unitPrice": 945, "productName": "Tiles trims"}, {"unit": "sqm", "total": 5000, "margin": 25, "category": "lighting", "quantity": 5, "productId": "46ea6c8c-3e0c-455a-8cd4-4d945aad8d24", "unitPrice": 1000, "productName": "Tiles trims"}]', 9725, '{"type": "percentage", "value": 5}', '{"rate": 5, "type": "VAT"}', 9700.69, '2026-01-31', 'a36b52fa-d7c2-442c-a58a-fe7eecde26ad', 1, '2026-01-01 17:20:58.774754+00', '2026-01-01 17:20:58.774754+00', NULL, 'Adil bakht', 'draft');

-- Settings Data
INSERT INTO public.settings (id, user_id, value, created_at, updated_at, key) VALUES
('ca925f0e-7c03-47f7-a5e8-291e2400a45d', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', '{"email": "Info@targetspecialties.com", "phone": "+971509587185", "address": "Buliding Rema plaza | Office no. 1 Aljurf 3 Ajman UAE.", "companyName": "Target specialties", "tradeLicense": "Target Specialties"}', '2025-12-12 10:13:13.229767+00', '2025-12-12 10:13:13.229767+00', 'company'),
('fe0367a0-a18d-4f84-936e-d7d7b151ef72', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', '{"currency": "AED", "taxNumber": "", "vatRate": 3}', '2025-12-12 10:13:37.805487+00', '2025-12-12 10:13:37.805487+00', 'tax');

-- User Roles Data (Note: These are created automatically by the handle_new_user trigger)
INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES
('36ffdd18-7025-4f3f-b61a-fc93e85c0825', 'f0e297e2-8832-4d0d-9ae8-7c1f683ddc87', 'admin', '2025-12-06 03:45:19.519057+00'),
('0e6560e6-3255-4307-9a41-808c9450ac03', '1ac29930-3a7a-4cc1-95e0-5b12c6654cd6', 'sales_manager', '2026-01-01 10:41:41.747285+00');

-- ============================================
-- END OF DATABASE EXPORT
-- ============================================
-- 
-- IMPORTANT NOTES:
-- 1. Before running this script, create users in auth.users first
-- 2. Update the user_id values in the INSERT statements to match your new user IDs
-- 3. The handle_new_user trigger will automatically create profiles and user_roles for new users
-- 4. You may want to disable the trigger temporarily when inserting existing data
-- ============================================
