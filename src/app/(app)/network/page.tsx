'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, UserPlus, Users, Clock } from 'lucide-react';
import { ConnectionCard, Card } from '@/components';
import { useAuthStore } from '@/store';
import { useNetwork } from '@/hooks/use-network';
import type { PopulatedConnection, User, PublicUser } from '@/types';

type NetworkTab = 'connections' | 'pending' | 'suggestions';

export default function NetworkPage() {
  const { user } = useAuthStore();
  const { connect, acceptConnection, rejectConnection, removeConnection } = useNetwork();
  const [activeTab, setActiveTab] = useState<NetworkTab>('connections');
  const [connections, setConnections] = useState<PopulatedConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PopulatedConnection[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    try {
      // Fetch accepted connections
      const acceptedResponse = await fetch('/api/network/connections?status=accepted');
      const acceptedData = await acceptedResponse.json();
      
      // Fetch pending requests (received by current user)
      const pendingResponse = await fetch('/api/network/connections?status=pending');
      const pendingData = await pendingResponse.json();
      
      console.log('Accepted connections:', acceptedData);
      console.log('Pending requests:', pendingData);
      
      if (acceptedData.success) {
        setConnections(acceptedData.data);
      }
      
      if (pendingData.success) {
        setPendingRequests(pendingData.data);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      // Fetch some users as suggestions (in production, this would be a dedicated endpoint)
      const response = await fetch('/api/users?limit=10');
      const data = await response.json();
      if (data.success) {
        // Filter out current user and existing connections
        const connectedIds = new Set(
          connections.map((c) => {
            const other = c.requesterId === user?._id ? c.recipientId : c.requesterId;
            return typeof other === 'string' ? other : (other as any)?._id as string;
          }).filter((id): id is string => !!id)
        );
        setSuggestions(
          data.data.filter(
            (u: User) => u._id !== user?._id && !connectedIds.has(u._id)
          )
        );
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  }, [user, connections]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchConnections();
      setIsLoading(false);
    };
    loadData();
  }, [fetchConnections]);

  useEffect(() => {
    if (activeTab === 'suggestions') {
      fetchSuggestions();
    }
  }, [activeTab, fetchSuggestions]);

  const handleConnect = async (userId: string) => {
    try {
      console.log('Attempting to connect with user:', userId);
      const result = await connect(userId);
      console.log('Connect result:', result);
      if (result.success) {
        // Remove from suggestions
        setSuggestions((prev) => prev.filter((u) => u._id !== userId));
        // Refresh connections to update pending list on the other user's side
        await fetchConnections();
        alert('Connection request sent!');
      } else {
        console.error('Failed to connect:', result);
        // Show different message if already pending
        if (result.error?.includes('already pending')) {
          alert('You already have a pending connection request with this user');
        } else {
          alert(result.error || 'Failed to send connection request');
        }
      }
    } catch (error) {
      console.error('Error in handleConnect:', error);
      alert('An error occurred while sending the connection request');
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      const response = await fetch('/api/network/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ connectionId, action: 'accept' }),
      });
      const result = await response.json();
      if (result.success) {
        // Refresh connections to get updated lists
        await fetchConnections();
        alert('Connection accepted!');
      } else {
        console.error('Failed to accept connection:', result);
        alert('Failed to accept connection');
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
      alert('An error occurred');
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      const response = await fetch('/api/network/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ connectionId, action: 'reject' }),
      });
      const result = await response.json();
      if (result.success) {
        // Refresh to remove from pending list
        await fetchConnections();
      } else {
        console.error('Failed to reject connection:', result);
        alert('Failed to reject connection');
      }
    } catch (error) {
      console.error('Error rejecting connection:', error);
      alert('An error occurred');
    }
  };

  const handleRemove = async (connectionId: string) => {
    const result = await removeConnection(connectionId);
    if (result.success) {
      setConnections((prev) => prev.filter((c) => c._id !== connectionId));
    }
  };

  const getOtherUser = (connection: PopulatedConnection): PublicUser | null => {
    const requesterId = typeof connection.requesterId === 'string' ? connection.requesterId : connection.requesterId._id;
    const isRequester = requesterId === user?._id;
    const otherParty = isRequester ? connection.recipientId : connection.requesterId;
    return typeof otherParty === 'object' ? otherParty : null;
  };

  const tabs = [
    { id: 'connections' as const, label: 'Connections', icon: Users, count: connections.length },
    { id: 'pending' as const, label: 'Pending', icon: Clock, count: pendingRequests.length },
    { id: 'suggestions' as const, label: 'Suggestions', icon: UserPlus, count: suggestions.length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Network</h1>

      {/* Tabs */}
      <div className="flex border-b border-surface-border mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activeTab === 'connections' && (
            <>
              {connections.length > 0 ? (
                connections.map((connection, index) => {
                  const otherUser = getOtherUser(connection);
                  if (!otherUser) return null;
                  return (
                    <motion.div
                      key={connection._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ConnectionCard
                        user={otherUser}
                        connection={connection}
                        type="connection"
                        onRemove={handleRemove}
                      />
                    </motion.div>
                  );
                })
              ) : (
                <Card className="md:col-span-2 text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No connections yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Start connecting with people to grow your network
                  </p>
                </Card>
              )}
            </>
          )}

          {activeTab === 'pending' && (
            <>
              {pendingRequests.length > 0 ? (
                pendingRequests.map((connection, index) => {
                  const otherUser = getOtherUser(connection);
                  if (!otherUser) return null;
                  return (
                    <motion.div
                      key={connection._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ConnectionCard
                        user={otherUser}
                        connection={connection}
                        type="request"
                        onAccept={handleAccept}
                        onReject={handleReject}
                      />
                    </motion.div>
                  );
                })
              ) : (
                <Card className="md:col-span-2 text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending requests</p>
                </Card>
              )}
            </>
          )}

          {activeTab === 'suggestions' && (
            <>
              {suggestions.length > 0 ? (
                suggestions.map((suggestedUser, index) => (
                  <motion.div
                    key={suggestedUser._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ConnectionCard
                      user={suggestedUser}
                      type="suggestion"
                      onConnect={handleConnect}
                    />
                  </motion.div>
                ))
              ) : (
                <Card className="md:col-span-2 text-center py-12">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No suggestions available</p>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
