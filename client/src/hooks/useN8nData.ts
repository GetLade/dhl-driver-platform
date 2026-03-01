import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Hook to fetch and auto-refresh n8n webhook data
 * Polls for new data every 5 seconds
 */
export function useN8nData(dataType?: string) {
  const [isPolling, setIsPolling] = useState(true);
  
  // Query to get all latest data
  const allDataQuery = trpc.n8n.getLatest.useQuery(undefined, {
    enabled: isPolling && !dataType,
    refetchInterval: 5000, // Poll every 5 seconds
  });
  
  // Query to get specific data type
  const typeDataQuery = trpc.n8n.getByType.useQuery(dataType || '', {
    enabled: isPolling && !!dataType,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  return {
    data: dataType ? typeDataQuery.data : allDataQuery.data,
    isLoading: dataType ? typeDataQuery.isLoading : allDataQuery.isLoading,
    error: dataType ? typeDataQuery.error : allDataQuery.error,
    isPolling,
    setIsPolling,
    refetch: dataType ? typeDataQuery.refetch : allDataQuery.refetch,
  };
}
