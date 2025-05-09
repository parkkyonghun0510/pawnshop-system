import { useState } from 'react';
import { branchService, handleApiError } from '../services/api';

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await branchService.getBranches(params);
      setBranches(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchBranch = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await branchService.getBranch(id);
      setCurrentBranch(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async (branchData: Partial<Branch>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await branchService.createBranch(branchData);
      // Update the branches list by appending the new branch
      setBranches(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateBranch = async (id: string, branchData: Partial<Branch>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await branchService.updateBranch(id, branchData);
      // Update the branches list by replacing the updated branch
      setBranches(prev => 
        prev.map(branch => branch.id === id ? response.data : branch)
      );
      // If current branch is being updated, update that too
      if (currentBranch && currentBranch.id === id) {
        setCurrentBranch(response.data);
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

  const deleteBranch = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await branchService.deleteBranch(id);
      // Remove the deleted branch from the list
      setBranches(prev => prev.filter(branch => branch.id !== id));
      // If current branch is being deleted, clear it
      if (currentBranch && currentBranch.id === id) {
        setCurrentBranch(null);
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
    branches,
    currentBranch,
    loading,
    error,
    fetchBranches,
    fetchBranch,
    createBranch,
    updateBranch,
    deleteBranch,
  };
};

export default useBranches; 