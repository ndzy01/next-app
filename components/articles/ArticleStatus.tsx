'use client';

import React, { useState } from 'react';
import { ArticleStatus, getStatusDisplayName, canPublish } from '@/lib/article-status';

interface ArticleProps {
  id: string;
  title: string;
  content: string;
  published: boolean;
}

interface ArticleStatusProps {
  currentStatus: ArticleStatus;
  article?: ArticleProps;
  onStatusChange?: (newStatus: ArticleStatus) => void;
  disabled?: boolean;
}

export default function ArticleStatusComponent({
  currentStatus,
  article,
  onStatusChange,
  disabled = false
}: ArticleStatusProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ArticleStatus | null>(null);

  const getStatusBadge = (status: ArticleStatus) => {
    const colors = {
      [ArticleStatus.DRAFT]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
      [ArticleStatus.PUBLISHED]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
      [ArticleStatus.ARCHIVED]: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status]}`}>
        {getStatusDisplayName(status)}
      </span>
    );
  };

  const handleStatusChange = (newStatus: ArticleStatus) => {
    if (newStatus === ArticleStatus.PUBLISHED) {
      if (!article) {
        alert('无法发布文章：文章信息不完整');
        return;
      }
      const { allowed, reason } = canPublish(article);
      if (!allowed) {
        alert(`无法发布文章：${reason}`);
        return;
      }
    }

    if (newStatus === ArticleStatus.PUBLISHED) {
      setTargetStatus(newStatus);
      setShowConfirm(true);
    } else {
      onStatusChange?.(newStatus);
    }
  };

  const confirmPublish = () => {
    if (targetStatus) {
      onStatusChange?.(targetStatus);
    }
    setShowConfirm(false);
    setTargetStatus(null);
  };

  const cancelPublish = () => {
    setShowConfirm(false);
    setTargetStatus(null);
  };

  return (
    <div className="space-y-4">
      {/* 当前状态显示 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          当前状态
        </label>
        {getStatusBadge(currentStatus)}
      </div>

      {/* 状态切换按钮 */}
      {!disabled && onStatusChange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            更改状态
          </label>
          <div className="flex flex-wrap gap-2">
            {currentStatus !== ArticleStatus.PUBLISHED && (
              <button
                type="button"
                onClick={() => handleStatusChange(ArticleStatus.PUBLISHED)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                发布文章
              </button>
            )}
            
            {currentStatus !== ArticleStatus.DRAFT && (
              <button
                type="button"
                onClick={() => handleStatusChange(ArticleStatus.DRAFT)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                转为草稿
              </button>
            )}
            
            {currentStatus !== ArticleStatus.ARCHIVED && (
              <button
                type="button"
                onClick={() => handleStatusChange(ArticleStatus.ARCHIVED)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                归档文章
              </button>
            )}
          </div>
        </div>
      )}

      {/* 发布确认对话框 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              确认发布文章
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              文章发布后将对所有用户可见。请确保内容完整且符合规范。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelPublish}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmPublish}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                确认发布
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 状态说明 */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p><strong>草稿</strong> - 仅作者可见，可随时编辑</p>
        <p><strong>已发布</strong> - 仅作者可见，可转为草稿或归档</p>
        <p><strong>已归档</strong> - 隐藏文章，可转为草稿重新编辑</p>
      </div>
    </div>
  );
}
