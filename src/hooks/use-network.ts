/**
 * Network Hooks
 * Hooks for connection/network operations
 */

import { useCallback } from 'react';

export function useNetwork() {
  const connect = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/network/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipientId: userId }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to connect:', error);
      return { success: false, error: 'Failed to send connection request' };
    }
  }, []);

  const acceptConnection = useCallback(async (connectionId: string) => {
    try {
      const response = await fetch('/api/network/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ connectionId, action: 'accept' }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to accept connection:', error);
      return { success: false, error: 'Failed to accept connection' };
    }
  }, []);

  const rejectConnection = useCallback(async (connectionId: string) => {
    try {
      const response = await fetch('/api/network/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ connectionId, action: 'reject' }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to reject connection:', error);
      return { success: false, error: 'Failed to reject connection' };
    }
  }, []);

  const removeConnection = useCallback(async (connectionId: string) => {
    try {
      const response = await fetch(`/api/network/${connectionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to remove connection:', error);
      return { success: false, error: 'Failed to remove connection' };
    }
  }, []);

  return {
    connect,
    acceptConnection,
    rejectConnection,
    removeConnection,
  };
}

export default useNetwork;
