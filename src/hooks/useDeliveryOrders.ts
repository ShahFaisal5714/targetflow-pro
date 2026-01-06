import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';

export interface DeliveryItem {
  productId: string;
  productName: string;
  unit: string;
  orderedQuantity: number;
  deliveryQuantity: number;
}

export interface DeliveryOrder {
  id: string;
  user_id: string;
  delivery_number: string;
  project_id: string | null;
  items: DeliveryItem[];
  delivery_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbDeliveryOrder {
  id: string;
  user_id: string;
  delivery_number: string;
  project_id: string | null;
  items: unknown;
  delivery_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const mapDbToDeliveryOrder = (db: DbDeliveryOrder): DeliveryOrder => ({
  id: db.id,
  user_id: db.user_id,
  delivery_number: db.delivery_number,
  project_id: db.project_id,
  items: (db.items as DeliveryItem[]) || [],
  delivery_date: db.delivery_date,
  status: db.status,
  notes: db.notes,
  created_at: db.created_at,
  updated_at: db.updated_at,
});

export function useDeliveryOrders() {
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDeliveryOrders = async () => {
    if (!user) {
      setDeliveryOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDeliveryOrders((data || []).map(mapDbToDeliveryOrder));
    } catch (error) {
      logError('useDeliveryOrders.fetchDeliveryOrders', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch delivery orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDeliveryNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('delivery_orders')
      .select('*', { count: 'exact', head: true });
    
    const nextNumber = (count || 0) + 1;
    return `DO-${year}-${String(nextNumber).padStart(4, '0')}`;
  };

  const createDeliveryOrder = async (orderData: Partial<DeliveryOrder>) => {
    if (!user) return null;

    try {
      const deliveryNumber = await generateDeliveryNumber();
      const insertData = {
        user_id: user.id,
        delivery_number: deliveryNumber,
        project_id: orderData.project_id || null,
        items: JSON.parse(JSON.stringify(orderData.items || [])),
        delivery_date: orderData.delivery_date || null,
        status: orderData.status || 'pending',
        notes: orderData.notes || null,
      };

      const { data, error } = await supabase
        .from('delivery_orders')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newOrder = mapDbToDeliveryOrder(data);
      setDeliveryOrders((prev) => [newOrder, ...prev]);

      toast({
        title: 'Success',
        description: 'Delivery order created successfully',
      });

      return newOrder;
    } catch (error) {
      logError('useDeliveryOrders.createDeliveryOrder', error);
      toast({
        title: 'Error',
        description: 'Failed to create delivery order',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateDeliveryOrder = async (id: string, updates: Partial<DeliveryOrder>) => {
    try {
      const updateData = {
        project_id: updates.project_id,
        items: updates.items ? JSON.parse(JSON.stringify(updates.items)) : undefined,
        delivery_date: updates.delivery_date,
        status: updates.status,
        notes: updates.notes,
      };

      const { data, error } = await supabase
        .from('delivery_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedOrder = mapDbToDeliveryOrder(data);
      setDeliveryOrders((prev) =>
        prev.map((order) => (order.id === id ? updatedOrder : order))
      );

      toast({
        title: 'Success',
        description: 'Delivery order updated successfully',
      });

      return updatedOrder;
    } catch (error) {
      logError('useDeliveryOrders.updateDeliveryOrder', error);
      toast({
        title: 'Error',
        description: 'Failed to update delivery order',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteDeliveryOrder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDeliveryOrders((prev) => prev.filter((order) => order.id !== id));

      toast({
        title: 'Success',
        description: 'Delivery order deleted successfully',
      });

      return true;
    } catch (error) {
      logError('useDeliveryOrders.deleteDeliveryOrder', error);
      toast({
        title: 'Error',
        description: 'Failed to delete delivery order',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchDeliveryOrders();
  }, [user]);

  return {
    deliveryOrders,
    loading,
    createDeliveryOrder,
    updateDeliveryOrder,
    deleteDeliveryOrder,
    refetch: fetchDeliveryOrders,
  };
}
