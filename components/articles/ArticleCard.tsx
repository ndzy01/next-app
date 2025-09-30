'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, User, Edit, Trash2, Eye } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

interface ArticleCardProps {
  article: Article;
  showActions?: boolean;
  onDelete?: () => void;
}

export default function ArticleCard({
  article,
  showActions = false,
  onDelete
}: ArticleCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 sm:p-6">
        {/* 文章标题和状态 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
          <div className="flex-1 mb-3 sm:mb-0">
            <Link 
              href={`/articles/${article.id}`}
              className="block group"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                {article.title}
              </h2>
            </Link>
            
            {/* 发布状态标识 */}
            {!article.published && (
              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                📝 草稿
              </span>
            )}
          </div>

          {/* 操作按钮 - 移动端优化 */}
          {showActions && (
            <div className="flex items-center space-x-1 sm:space-x-2 self-start sm:ml-4">
              <Link
                href={`/articles/${article.id}`}
                className="p-2 sm:p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="查看文章"
              >
                <Eye size={18} className="sm:w-4 sm:h-4" />
              </Link>
              <Link
                href={`/articles/${article.id}/edit`}
                className="p-2 sm:p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="编辑文章"
              >
                <Edit size={18} className="sm:w-4 sm:h-4" />
              </Link>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-2 sm:p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="删除文章"
                >
                  <Trash2 size={18} className="sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 文章摘要 */}
        {article.excerpt && (
          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed text-sm sm:text-base line-clamp-3">
            {truncateText(article.excerpt, 180)}
          </p>
        )}

        {/* 标签 - 移动端优化 */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
            {article.tags.slice(0, 4).map((tag) => (
              <span
                key={tag.id}
                className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full transition-colors hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
              >
                #{tag.name}
              </span>
            ))}
            {article.tags.length > 4 && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded-full">
                +{article.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* 文章元信息 - 移动端优化 */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-3 sm:pt-4">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {/* 作者信息 */}
              {article.author_name && (
                <div className="flex items-center space-x-1">
                  <User size={14} className="flex-shrink-0" />
                  <span className="truncate">{article.author_name}</span>
                </div>
              )}

              {/* 创建日期 */}
              <div className="flex items-center space-x-1">
                <Calendar size={14} className="flex-shrink-0" />
                <span>{formatDate(article.created_at)}</span>
              </div>
            </div>

            {/* 更新时间（如果与创建时间不同） */}
            {article.updated_at !== article.created_at && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                更新于 {formatDate(article.updated_at)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}