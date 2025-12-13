'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Users, FileText, Image, X } from 'lucide-react';
import { Card } from '@/components/ui';
import { ConnectionCard } from '@/components';
import type { PublicUser } from '@/types';
import type { LucideIcon } from 'lucide-react';

type SearchFilter = 'all' | 'users' | 'posts' | 'media';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          search: query,
          limit: '20',
        });

        const response = await fetch(`/api/users?${params}`);
        const data = await response.json();

        if (data.success) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const filters: { value: SearchFilter; label: string; icon: LucideIcon }[] = [
    { value: 'all', label: 'All', icon: SearchIcon },
    { value: 'users', label: 'People', icon: Users },
    { value: 'posts', label: 'Posts', icon: FileText },
    { value: 'media', label: 'Media', icon: Image },
  ];

  return (
    <div className="min-h-screen bg-surface-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search</h1>
          
          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for people, posts, or content..."
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filter === f.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div>
          {!query && (
            <Card className="p-8 text-center">
              <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Search for people and content
              </h3>
              <p className="text-gray-600">
                Enter a search term to find users, posts, and media
              </p>
            </Card>
          )}

          {query && isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent" />
            </div>
          )}

          {query && !isLoading && users.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-gray-600">No results found for &quot;{query}&quot;</p>
            </Card>
          )}

          {query && !isLoading && users.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                People ({users.length})
              </h2>
              <div className="space-y-4">
                {users.map((user) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ConnectionCard user={user} type="suggestion" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
