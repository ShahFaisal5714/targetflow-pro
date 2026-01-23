import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';

const SCHEMA_SQL = `-- Database Export
-- Generated on: ${new Date().toISOString()}
-- 
-- IMPORTANT: Before running this script:
-- 1. Create users in your Supabase Auth dashboard
-- 2. Replace the user_id values in the INSERT statements with your new user IDs
-- 3. Run this script in the SQL Editor of your Supabase dashboard

-- =============================================
-- ENUM TYPES
-- =============================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'sales_manager', 'sales_rep', 'inventory_manager', 'accountant', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABLE DEFINITIONS
-- =============================================

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  logo_url text,
  email text,
  phone text,
  address text,
  website text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Delivery Orders table
CREATE TABLE IF NOT EXISTS public.delivery_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  delivery_number text NOT NULL,
  project_id uuid,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending'::text,
  delivery_date date,
  notes text,
  company_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  invoice_number text NOT NULL,
  project_id uuid,
  company_id text,
  client_name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 5,
  tax_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'::text,
  due_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  sku text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'lighting'::text,
  color text,
  unit text NOT NULL DEFAULT 'piece'::text,
  price numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  reorder_level integer NOT NULL DEFAULT 10,
  company_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  avatar_url text,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  company_id uuid,
  name text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'lead'::text,
  value numeric NOT NULL DEFAULT 0,
  contractor jsonb NOT NULL DEFAULT '{}'::jsonb,
  client jsonb NOT NULL DEFAULT '{}'::jsonb,
  consultant jsonb,
  developer jsonb,
  timeline jsonb NOT NULL DEFAULT '{"endDate": "", "startDate": "", "milestones": []}'::jsonb,
  sales_manager text,
  sales_manager_contact text,
  buyer_trn text,
  attn_to text,
  client_email text,
  client_contact text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Quotations table
CREATE TABLE IF NOT EXISTS public.quotations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid,
  company_id uuid,
  project_name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount jsonb DEFAULT '{"type": "percentage", "value": 0}'::jsonb,
  tax jsonb DEFAULT '{"rate": 5, "type": "VAT"}'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'::text,
  version integer NOT NULL DEFAULT 1,
  valid_until date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

-- User Roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'viewer'::public.app_role,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- DATABASE FUNCTIONS
-- =============================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  
  RETURN NEW;
END;
$$;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for new user registration (attach to auth.users)
-- Note: You need to create this trigger manually in Supabase dashboard
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Companies policies
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
CREATE POLICY "Users can view their own companies" ON public.companies FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own companies" ON public.companies;
CREATE POLICY "Users can create their own companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
CREATE POLICY "Users can update their own companies" ON public.companies FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;
CREATE POLICY "Users can delete their own companies" ON public.companies FOR DELETE USING (auth.uid() = user_id);

-- Delivery Orders policies
DROP POLICY IF EXISTS "Users can view their own delivery orders" ON public.delivery_orders;
CREATE POLICY "Users can view their own delivery orders" ON public.delivery_orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create delivery orders" ON public.delivery_orders;
CREATE POLICY "Users can create delivery orders" ON public.delivery_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own delivery orders" ON public.delivery_orders;
CREATE POLICY "Users can update their own delivery orders" ON public.delivery_orders FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own delivery orders" ON public.delivery_orders;
CREATE POLICY "Users can delete their own delivery orders" ON public.delivery_orders FOR DELETE USING (auth.uid() = user_id);

-- Invoices policies
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create invoices" ON public.invoices;
CREATE POLICY "Users can create invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
CREATE POLICY "Users can update their own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
CREATE POLICY "Users can delete their own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- Products policies
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
CREATE POLICY "Users can view their own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create products" ON public.products;
CREATE POLICY "Users can create products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Projects policies
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
CREATE POLICY "Admins can view all projects" ON public.projects FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can update all projects" ON public.projects;
CREATE POLICY "Admins can update all projects" ON public.projects FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can delete all projects" ON public.projects;
CREATE POLICY "Admins can delete all projects" ON public.projects FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Quotations policies
DROP POLICY IF EXISTS "Users can view their own quotations" ON public.quotations;
CREATE POLICY "Users can view their own quotations" ON public.quotations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create quotations" ON public.quotations;
CREATE POLICY "Users can create quotations" ON public.quotations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own quotations" ON public.quotations;
CREATE POLICY "Users can update their own quotations" ON public.quotations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own quotations" ON public.quotations;
CREATE POLICY "Users can delete their own quotations" ON public.quotations FOR DELETE USING (auth.uid() = user_id);

-- Settings policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.settings;
CREATE POLICY "Users can view their own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create their own settings" ON public.settings;
CREATE POLICY "Users can create their own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own settings" ON public.settings;
CREATE POLICY "Users can update their own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.settings;
CREATE POLICY "Users can delete their own settings" ON public.settings FOR DELETE USING (auth.uid() = user_id);

-- User Roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete user_roles" ON public.user_roles;
CREATE POLICY "Admins can delete user_roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update any user_role" ON public.user_roles;
CREATE POLICY "Admins can update any user_role" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

`;

function escapeSQL(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateInsertStatements(tableName: string, rows: Record<string, unknown>[]): string {
  if (!rows || rows.length === 0) return `-- No data in ${tableName}\n`;
  
  const columns = Object.keys(rows[0]);
  let sql = `-- ${tableName} data (${rows.length} rows)\n`;
  
  for (const row of rows) {
    const values = columns.map(col => escapeSQL(row[col])).join(', ');
    sql += `INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
  }
  
  return sql + '\n';
}

export type ExportFormat = 'sql' | 'json';

export function useDatabaseExport() {
  const [exporting, setExporting] = useState(false);

  const fetchAllData = async () => {
    const [
      companiesResult,
      deliveryOrdersResult,
      invoicesResult,
      productsResult,
      profilesResult,
      projectsResult,
      quotationsResult,
      settingsResult,
      userRolesResult
    ] = await Promise.all([
      supabase.from('companies').select('*'),
      supabase.from('delivery_orders').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('products').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('quotations').select('*'),
      supabase.from('settings').select('*'),
      supabase.from('user_roles').select('*')
    ]);

    return {
      companies: companiesResult.data || [],
      delivery_orders: deliveryOrdersResult.data || [],
      invoices: invoicesResult.data || [],
      products: productsResult.data || [],
      profiles: profilesResult.data || [],
      projects: projectsResult.data || [],
      quotations: quotationsResult.data || [],
      settings: settingsResult.data || [],
      user_roles: userRolesResult.data || []
    };
  };

  const exportAsSQL = async () => {
    try {
      setExporting(true);
      
      const data = await fetchAllData();
      
      // Build the SQL file content
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let sqlContent = SCHEMA_SQL.replace(
        '-- Generated on: ${new Date().toISOString()}',
        `-- Generated on: ${new Date().toISOString()}`
      );
      
      sqlContent += '\n-- =============================================\n';
      sqlContent += '-- DATA\n';
      sqlContent += '-- =============================================\n\n';
      
      // Add INSERT statements for each table
      sqlContent += generateInsertStatements('profiles', data.profiles);
      sqlContent += generateInsertStatements('user_roles', data.user_roles);
      sqlContent += generateInsertStatements('companies', data.companies);
      sqlContent += generateInsertStatements('settings', data.settings);
      sqlContent += generateInsertStatements('products', data.products);
      sqlContent += generateInsertStatements('projects', data.projects);
      sqlContent += generateInsertStatements('quotations', data.quotations);
      sqlContent += generateInsertStatements('invoices', data.invoices);
      sqlContent += generateInsertStatements('delivery_orders', data.delivery_orders);
      
      // Create and download the file
      const blob = new Blob([sqlContent], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-export-${timestamp}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Complete',
        description: 'Your database has been exported as SQL successfully.'
      });
    } catch (error) {
      logError('useDatabaseExport.exportAsSQL', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export database. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  const exportAsJSON = async () => {
    try {
      setExporting(true);
      
      const data = await fetchAllData();
      
      // Add metadata
      const exportData = {
        _meta: {
          exportedAt: new Date().toISOString(),
          format: 'json',
          version: '1.0'
        },
        ...data
      };
      
      // Create and download the file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-export-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Complete',
        description: 'Your database has been exported as JSON successfully.'
      });
    } catch (error) {
      logError('useDatabaseExport.exportAsJSON', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export database. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  const exportDatabase = async (format: ExportFormat = 'sql') => {
    if (format === 'json') {
      await exportAsJSON();
    } else {
      await exportAsSQL();
    }
  };

  return {
    exporting,
    exportDatabase,
    exportAsSQL,
    exportAsJSON
  };
}
