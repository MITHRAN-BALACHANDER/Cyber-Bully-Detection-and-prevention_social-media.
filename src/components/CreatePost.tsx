/**
 * CreatePost Component
 * Composer for creating new posts
 */

'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Video, X, Globe, Users, Lock as LockIcon, AlertCircle } from 'lucide-react';
import { Avatar, Button, Card, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { usePosts } from '@/hooks';
import { PostType, PostVisibility } from '@/types';

interface CreatePostProps {
  onSuccess?: () => void;
}

const visibilityOptions = [
  { value: 'public' as PostVisibility, icon: Globe, label: 'Anyone' },
  { value: 'connections' as PostVisibility, icon: Users, label: 'Connections' },
  { value: 'private' as PostVisibility, icon: LockIcon, label: 'Only me' },
];

export function CreatePost({ onSuccess }: CreatePostProps) {
  const { user } = useAuthStore();
  const { createPost, isLoading } = usePosts();
  
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = useState<('image' | 'video')[]>([]);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically determine post type based on media
  const getPostType = (): PostType => {
    if (mediaUrls.length === 0) return 'text';
    if (mediaTypes.some(t => t === 'video')) return 'video';
    return 'image';
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setError(null); // Clear any previous errors

    try {
      const result = await createPost({
        content,
        type: getPostType(),
        media: mediaUrls.length > 0 ? mediaUrls : undefined,
        visibility,
      });

      if (result.success) {
        setContent('');
        setMediaUrls([]);
        setMediaTypes([]);
        setError(null);
        onSuccess?.();
      } else {
        // Handle error
        const errorData = result.data || {};
        let errorMessage = result.error || 'Failed to create post';
        
        if (errorData.code === 'ACCOUNT_LOCKED') {
          const hours = Math.floor(errorData.remainingMinutes / 60);
          const minutes = errorData.remainingMinutes % 60;
          errorMessage = `Your account is locked for ${hours}h ${minutes}m due to multiple violations.`;
        } else if (errorData.code === 'CONTENT_MODERATION_FAILED') {
          errorMessage = `${result.error} (${errorData.dailyViolationCount || 0}/3 violations today)`;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Create preview URLs for the uploaded files
    const newUrls: string[] = [];
    const newTypes: ('image' | 'video')[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      
      await new Promise<void>((resolve) => {
        reader.onloadend = () => {
          if (reader.result) {
            newUrls.push(reader.result as string);
            newTypes.push(isVideo ? 'video' : 'image');
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    
    setMediaUrls([...mediaUrls, ...newUrls]);
    setMediaTypes([...mediaTypes, ...newTypes]);
    
    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
    setMediaTypes(mediaTypes.filter((_, i) => i !== index));
  };

  if (!user) return null;

  const VisibilityIcon = visibilityOptions.find((v) => v.value === visibility)?.icon || Globe;

  return (
    <Card className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar src={user.avatar} name={user.name} size="md" />
        <div className="flex-1 relative">
          <p className="font-semibold text-gray-900">{user.name}</p>
          <button
            onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mt-0.5"
          >
            <VisibilityIcon className="w-3.5 h-3.5" />
            <span>{visibilityOptions.find((v) => v.value === visibility)?.label}</span>
          </button>
          
          {/* Visibility Menu */}
          {showVisibilityMenu && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 min-w-[160px] overflow-hidden">
              {visibilityOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setVisibility(option.value);
                      setShowVisibilityMenu(false);
                    }}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors',
                      visibility === option.value && 'bg-primary-50 text-primary-600'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 ${
              error.includes('locked') 
                ? 'bg-red-50 border-red-300 text-red-900'
                : error.includes('violation')
                ? 'bg-yellow-50 border-yellow-300 text-yellow-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            {error.includes('locked') ? (
              <LockIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">{error}</p>
              {error.includes('locked') && (
                <p className="text-xs mt-1 opacity-80">
                  You can view your account status in Settings → Streak & Safety
                </p>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Input */}
      <Textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoResize
        className="border-0 focus:ring-0 p-0 resize-none min-h-[80px] text-base"
      />

      {/* Media Preview */}
      {mediaUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {mediaUrls.map((url, index) => (
            <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {mediaTypes[index] === 'video' ? (
                <video src={url} className="w-full h-full object-cover" controls />
              ) : (
                <img src={url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => removeMedia(index)}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleMediaUpload}
        className="hidden"
      />
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*';
                fileInputRef.current.click();
              }
            }}
            className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200"
            title="Add photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'video/*';
                fileInputRef.current.click();
              }
            }}
            className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200"
            title="Add video"
          >
            <Video className="w-5 h-5" />
          </button>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading}
          isLoading={isLoading}
          size="md"
        >
          Post
        </Button>
      </div>
    </Card>
  );
}

export default CreatePost;
