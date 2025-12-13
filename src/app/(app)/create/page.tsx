'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { CreatePost, Card, Button } from '@/components';

export default function CreatePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-surface-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>
        </div>

        {/* Create Post Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CreatePost
            onSuccess={() => {
              router.push('/feed');
            }}
          />
        </motion.div>

        {/* Tips */}
        <Card className="mt-6 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Tips for great posts</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Share valuable insights and experiences</li>
            <li>• Use clear and concise language</li>
            <li>• Add relevant media to make your post more engaging</li>
            <li>• Choose the right visibility for your audience</li>
            <li>• Engage with comments on your posts</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
