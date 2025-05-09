import { useState } from 'react';
import { loanService, handleApiError } from '../services/api';

interface Loan {
  id: string;
  customer_id: string;
  branch_id: string;
  principal_amount: number;
  interest_rate: number;
  term_days: number;
  status: string;
  start_date: string;
  due_date: string;
  items: any[];
  created_at: string;
  updated_at: string;
}

export const useLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [currentLoan, setCurrentLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loanService.getLoans(params);
      setLoans(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchLoan = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loanService.getLoan(id);
      setCurrentLoan(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createLoan = async (loanData: Partial<Loan>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loanService.createLoan(loanData);
      // Update the loans list by appending the new loan
      setLoans(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateLoan = async (id: string, loanData: Partial<Loan>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loanService.updateLoan(id, loanData);
      // Update the loans list by replacing the updated loan
      setLoans(prev => 
        prev.map(loan => loan.id === id ? response.data : loan)
      );
      // If current loan is being updated, update that too
      if (currentLoan && currentLoan.id === id) {
        setCurrentLoan(response.data);
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

  const deleteLoan = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await loanService.deleteLoan(id);
      // Remove the deleted loan from the list
      setLoans(prev => prev.filter(loan => loan.id !== id));
      // If current loan is being deleted, clear it
      if (currentLoan && currentLoan.id === id) {
        setCurrentLoan(null);
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
    loans,
    currentLoan,
    loading,
    error,
    fetchLoans,
    fetchLoan,
    createLoan,
    updateLoan,
    deleteLoan,
  };
};

export default useLoans; 