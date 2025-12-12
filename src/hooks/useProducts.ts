import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string;
  color: string | null;
  price: number;
  cost: number;
  stock_quantity: number;
  reorder_level: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  name: string;
  sku: string;
  description?: string;
  category: string;
  color?: string;
  price: number;
  cost: number;
  stock_quantity: number;
  reorder_level: number;
  unit: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching products',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (input: ProductInput) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a product',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setProducts((prev) => [data, ...prev]);
      toast({
        title: 'Product created',
        description: 'Product has been added successfully',
      });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating product',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateProduct = async (id: string, input: Partial<ProductInput>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? data : p))
      );
      toast({
        title: 'Product updated',
        description: 'Product has been updated successfully',
      });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating product',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: 'Product deleted',
        description: 'Product has been removed successfully',
      });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error deleting product',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
}
