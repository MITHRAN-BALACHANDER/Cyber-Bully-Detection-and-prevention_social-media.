/**
 * MediaGrid Component
 * Instagram-style media grid display
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { cn, formatCount, formatRelativeTime } from '@/lib/utils';
import type { PopulatedMedia, PublicUser } from '@/types';

interface MediaGridProps {
  media: PopulatedMedia[];
  columns?: 3 | 4;
  onLike?: (mediaId: string) => void;
}

export function MediaGrid({ media, columns = 3, onLike }: MediaGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < media.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const selectedMedia = selectedIndex !== null ? media[selectedIndex] : null;

  return (
    <>
      {/* Grid */}
      <div
        className={cn(
          'grid gap-1',
          columns === 3 && 'grid-cols-3',
          columns === 4 && 'grid-cols-4'
        )}
      >
        {media.map((item, index) => (
          <motion.div
            key={item._id}
            whileHover={{ scale: 1.02 }}
            className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden"
            onClick={() => setSelectedIndex(index)}
          >
            <Image
              src={item.thumbnailUrl || item.url}
              alt={item.caption || 'Media'}
              fill
              className="object-cover"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
              <div className="flex items-center gap-1 text-white">
                <Heart className="w-5 h-5 fill-current" />
                <span className="font-semibold">
                  {formatCount(item.likeCount || item.likes.length)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-white">
                <MessageCircle className="w-5 h-5 fill-current" />
                <span className="font-semibold">
                  {formatCount(item.commentCount || item.comments.length)}
                </span>
              </div>
            </div>
            {/* Video indicator */}
            {item.type === 'video' && (
              <div className="absolute top-2 right-2">
                <svg
                  className="w-6 h-6 text-white drop-shadow"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            {selectedIndex !== null && selectedIndex > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {selectedIndex !== null && selectedIndex < media.length - 1 && (
              <button
                className="absolute right-4 md:right-[340px] top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Media */}
            <div
              className="flex-1 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                key={selectedMedia._id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative max-w-3xl max-h-[80vh] w-full aspect-square"
              >
                <Image
                  src={selectedMedia.url}
                  alt={selectedMedia.caption || 'Media'}
                  fill
                  className="object-contain"
                />
              </motion.div>
            </div>

            {/* Sidebar */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="hidden md:flex flex-col w-80 bg-white h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <Avatar
                  src={(selectedMedia.ownerId as PublicUser).avatar}
                  name={(selectedMedia.ownerId as PublicUser).name}
                  size="sm"
                />
                <div>
                  <p className="font-semibold text-sm">
                    {(selectedMedia.ownerId as PublicUser).name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(selectedMedia.createdAt)}
                  </p>
                </div>
              </div>

              {/* Caption & Comments */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedMedia.caption && (
                  <p className="text-sm mb-4">
                    <span className="font-semibold mr-2">
                      {(selectedMedia.ownerId as PublicUser).username}
                    </span>
                    {selectedMedia.caption}
                  </p>
                )}
                {selectedMedia.comments.map((comment) => (
                  <div key={comment._id} className="mb-3">
                    <p className="text-sm">
                      <span className="font-semibold mr-2">
                        {(comment.authorId as unknown as PublicUser)?.username}
                      </span>
                      {comment.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(comment.createdAt)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-4 mb-3">
                  <button
                    onClick={() => onLike?.(selectedMedia._id)}
                    className={cn(
                      'hover:opacity-60 transition-opacity',
                      selectedMedia.isLiked && 'text-red-500'
                    )}
                  >
                    <Heart
                      className={cn(
                        'w-6 h-6',
                        selectedMedia.isLiked && 'fill-current'
                      )}
                    />
                  </button>
                  <button className="hover:opacity-60 transition-opacity">
                    <MessageCircle className="w-6 h-6" />
                  </button>
                </div>
                <p className="font-semibold text-sm">
                  {formatCount(
                    selectedMedia.likeCount || selectedMedia.likes.length
                  )}{' '}
                  likes
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MediaGrid;
