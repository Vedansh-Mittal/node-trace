import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = 'http://localhost:3001/api';

export interface Transaction {
  transactionId: string;
  timestamp: number;
  creator: string;
  currentOwner: string;
  previousOwners: string[];
  batchId: string;
  parentBatchId?: string;
  costPrice: string;
  sellingPrice: string;
  transactionHash?: string;
  previousHash?: string;
  correctionOf?: string;
  farmer?: any;
  processor?: any;
  distributor?: any;
  retailer?: any;
  consumer?: any;
  isActive: boolean;
  isSold: boolean;
}

export interface BatchStatus {
  exists: boolean;
  sold: boolean;
  transactionCount: number;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<Response>,
    successMessage?: string
  ): Promise<T | null> => {
    setLoading(true);
    try {
      const response = await apiCall();
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API call failed');
      }
      
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }
      
      return data;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createBatch = useCallback(async (batchData: any) => {
    return handleApiCall<any>(
      () => fetch(`${API_BASE_URL}/batch/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData)
      }),
      'Batch created successfully'
    );
  }, [handleApiCall]);

  const addProcessorData = useCallback(async (batchId: string, data: any) => {
    return handleApiCall<any>(
      () => fetch(`${API_BASE_URL}/batch/${batchId}/processor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      'Processor data added successfully'
    );
  }, [handleApiCall]);

  const addDistributorData = useCallback(async (batchId: string, data: any) => {
    return handleApiCall<any>(
      () => fetch(`${API_BASE_URL}/batch/${batchId}/distributor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      'Distributor data added successfully'
    );
  }, [handleApiCall]);

  const addRetailerData = useCallback(async (batchId: string, data: any) => {
    return handleApiCall<any>(
      () => fetch(`${API_BASE_URL}/batch/${batchId}/retailer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      'Retailer data added successfully'
    );
  }, [handleApiCall]);

  const markAsSold = useCallback(async (batchId: string, consumerData: any) => {
    return handleApiCall<any>(
      () => fetch(`${API_BASE_URL}/batch/${batchId}/sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumer: consumerData })
      }),
      'Batch marked as sold'
    );
  }, [handleApiCall]);

  const getFullTrace = useCallback(async (batchId: string): Promise<Transaction[] | null> => {
    return handleApiCall<Transaction[]>(
      () => fetch(`${API_BASE_URL}/batch/${batchId}/trace`)
    );
  }, [handleApiCall]);

  const getCurrentTransaction = useCallback(async (batchId: string): Promise<Transaction | null> => {
    return handleApiCall<Transaction>(
      () => fetch(`${API_BASE_URL}/batch/${batchId}/current`)
    );
  }, [handleApiCall]);

  const getBatchStatus = useCallback(async (batchId: string): Promise<BatchStatus | null> => {
    return handleApiCall<BatchStatus>(
      () => fetch(`${API_BASE_URL}/batch/${batchId}/status`)
    );
  }, [handleApiCall]);

  const getQRData = useCallback(async (batchId: string) => {
    return handleApiCall<any>(
      () => fetch(`${API_BASE_URL}/qr/${batchId}`)
    );
  }, [handleApiCall]);

  const verifyCertificate = useCallback(async (hash: string) => {
    return handleApiCall<any>(
      () => fetch(`${API_BASE_URL}/certificate/${hash}/verify`)
    );
  }, [handleApiCall]);

  return {
    loading,
    createBatch,
    addProcessorData,
    addDistributorData,
    addRetailerData,
    markAsSold,
    getFullTrace,
    getCurrentTransaction,
    getBatchStatus,
    getQRData,
    verifyCertificate
  };
};