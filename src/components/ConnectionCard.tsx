/**
 * ConnectionCard Component
 * LinkedIn-style connection request card
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, Briefcase, MapPin } from 'lucide-react';
import { Avatar, Button, Card } from '@/components/ui';
import { truncate } from '@/lib/utils';
import type { PublicUser, PopulatedConnection } from '@/types';

interface ConnectionCardProps {
  user: PublicUser;
  connection?: PopulatedConnection;
  type?: 'suggestion' | 'request' | 'connection';
  onConnect?: (userId: string) => Promise<void>;
  onAccept?: (connectionId: string) => Promise<void>;
  onReject?: (connectionId: string) => Promise<void>;
  onRemove?: (connectionId: string) => Promise<void>;
}

export function ConnectionCard({
  user,
  connection,
  type = 'suggestion',
  onConnect,
  onAccept,
  onReject,
  onRemove,
}: ConnectionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<void>, actionName: string) => {
    setIsLoading(true);
    try {
      await action();
      setActionTaken(actionName);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPosition = user.experience?.[0];

  if (actionTaken) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 0.95 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
      />
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link href={`/profile/${user.username}`}>
          <Avatar
            src={user.avatar}
            name={user.name}
            size="lg"
            className="hover:ring-2 hover:ring-primary-300 transition-all"
          />
        </Link>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${user.username}`}
            className="font-semibold text-gray-900 hover:text-primary-600 hover:underline"
          >
            {user.name}
          </Link>
          
          {user.headline && (
            <p className="text-sm text-gray-600 mt-0.5">
              {truncate(user.headline, 60)}
            </p>
          )}
          
          {currentPosition && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <Briefcase className="w-3.5 h-3.5" />
              <span>
                {currentPosition.title} at {currentPosition.company}
              </span>
            </div>
          )}

          {user.location && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{user.location}</span>
            </div>
          )}

          {/* Mutual Connections (placeholder) */}
          <p className="text-sm text-gray-500 mt-2">
            {Math.floor(Math.random() * 20) + 1} mutual connections
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {type === 'suggestion' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onConnect && handleAction(() => onConnect(user._id), 'connected')}
                  isLoading={isLoading}
                >
                  Connect
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-500"
                >
                  Ignore
                </Button>
              </>
            )}

            {type === 'request' && connection && (
              <>
                <Button
                  size="sm"
                  onClick={() => onAccept && handleAction(() => onAccept(connection._id), 'accepted')}
                  isLoading={isLoading}
                  className="gap-1"
                >
                  <Check className="w-4 h-4" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject && handleAction(() => onReject(connection._id), 'rejected')}
                  isLoading={isLoading}
                  className="gap-1"
                >
                  <X className="w-4 h-4" />
                  Ignore
                </Button>
              </>
            )}

            {type === 'connection' && connection && (
              <>
                <Link href={`/chat?user=${user._id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    Message
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-500"
                  onClick={() => onRemove && handleAction(() => onRemove(connection._id), 'removed')}
                >
                  Remove
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ConnectionCard;
