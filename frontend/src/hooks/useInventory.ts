import { useState } from 'react';
import { inventoryService, handleApiError } from '../services/api';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category_id: string;
  item_condition: string;
  appraised_value: number;
  status: string;
  loan_id?: string;
  branch_id: string;
  created_at: string;
  updated_at: string;
}

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryService.getInventory(params);
      setInventory(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItem = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryService.getInventoryItem(id);
      setCurrentItem(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addInventoryItem = async (itemData: Partial<InventoryItem>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryService.addInventoryItem(itemData);
      // Update the inventory list by appending the new item
      setInventory(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateInventoryItem = async (id: string, itemData: Partial<InventoryItem>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryService.updateInventoryItem(id, itemData);
      // Update the inventory list by replacing the updated item
      setInventory(prev => 
        prev.map(item => item.id === id ? response.data : item)
      );
      // If current item is being updated, update that too
      if (currentItem && currentItem.id === id) {
        setCurrentItem(response.data);
      }
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await inventoryService.deleteInventoryItem(id);
      // Remove the deleted item from the list
      setInventory(prev => prev.filter(item => item.id !== id));
      // If current item is being deleted, clear it
      if (currentItem && currentItem.id === id) {
        setCurrentItem(null);
      }
      return true;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    inventory,
    currentItem,
    loading,
    error,
    fetchInventory,
    fetchInventoryItem,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  };
};

export default useInventory; 