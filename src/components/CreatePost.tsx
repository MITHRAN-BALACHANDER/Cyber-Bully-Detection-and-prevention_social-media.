/**
 * CreatePost Component
 * Composer for creating new posts
 */

'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Video, FileText, X, Globe, Users, Lock } from 'lucide-react';
import { Avatar, Button, Card, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { usePosts } from '@/hooks';
import { PostType, PostVisibility } from '@/types';

interface CreatePostProps {
  onSuccess?: () => void;
}

const postTypes = [
  { type: 'text' as PostType, icon: FileText, label: 'Text' },
  { type: 'image' as PostType, icon: ImageIcon, label: 'Photo' },
  { type: 'video' as PostType, icon: Video, label: 'Video' },
  { type: 'article' as PostType, icon: FileText, label: 'Article' },
];

const visibilityOptions = [
  { value: 'public' as PostVisibility, icon: Globe, label: 'Anyone' },
  { value: 'connections' as PostVisibility, icon: Users, label: 'Connections' },
  { value: 'private' as PostVisibility, icon: Lock, label: 'Only me' },
];

export function CreatePost({ onSuccess }: CreatePostProps) {
  const { user } = useAuthStore();
  const { createPost, isLoading } = usePosts();
  
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    const result = await createPost({
      content,
      type: postType,
      title: postType === 'article' ? title : undefined,
      media: mediaUrls.length > 0 ? mediaUrls : undefined,
      visibility,
    });

    if (result.success) {
      setContent('');
      setTitle('');
      setMediaUrls([]);
      onSuccess?.();
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Create preview URLs for the uploaded files
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      await new Promise<void>((resolve) => {
        reader.onloadend = () => {
          if (reader.result) {
            newUrls.push(reader.result as string);
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    
    setMediaUrls([...mediaUrls, ...newUrls]);
  };

  const removeMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  if (!user) return null;

  const VisibilityIcon = visibilityOptions.find((v) => v.value === visibility)?.icon || Globe;

  return (
    <Card className="mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar src={user.avatar} name={user.name} size="md" />
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{user.name}</p>
          <button
            onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <VisibilityIcon className="w-4 h-4" />
            {visibilityOptions.find((v) => v.value === visibility)?.label}
          </button>
          
          {/* Visibility Menu */}
          {showVisibilityMenu && (
            <div className="absolute mt-1 bg-white border border-surface-border rounded-lg shadow-lg z-10">
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
                      'flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-50',
                      visibility === option.value && 'bg-primary-50 text-primary-600'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Post Type Selector */}
      <div className="flex gap-2 mb-4">
        {postTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.type}
              onClick={() => setPostType(type.type)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors',
                postType === type.type
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <Icon className="w-4 h-4" />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Article Title */}
      {postType === 'article' && (
        <input
          type="text"
          placeholder="Article title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 mb-3 text-lg font-semibold border-b border-surface-border focus:outline-none focus:border-primary-500"
        />
      )}

      {/* Content Input */}
      <Textarea
        placeholder={
          postType === 'article'
            ? 'Write your article...'
            : "What's on your mind?"
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoResize
        className="border-0 focus:ring-0 p-0 resize-none min-h-[100px]"
      />

      {/* Media Preview */}
      {mediaUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {mediaUrls.map((url, index) => (
            <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img src={url} alt="" className="w-full h-full object-cover" />
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
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-border">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*';
                fileInputRef.current.click();
              }
            }}
            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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
            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Add video"
          >
            <Video className="w-5 h-5" />
          </button>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading}
          isLoading={isLoading}
        >
          Post
        </Button>
      </div>
    </Card>
  );
}

export default CreatePost;
