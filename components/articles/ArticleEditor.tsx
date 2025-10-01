'use client';

import React, { useState, useCallback } from 'react';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import { ArticleStatus, booleanToStatus, canPublish } from '@/lib/article-status';

interface ArticleEditorProps {
  title?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  published?: boolean;
  onSave: (data: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    published: boolean;
  }) => Promise<void>;
  onCancel?: () => void;
  saving?: boolean;
  mode?: 'create' | 'edit';
}

export default function ArticleEditor({
  title: initialTitle = '',
  content: initialContent = '',
  excerpt: initialExcerpt = '',
  tags: initialTags = [],
  published: initialPublished = false,
  onSave,
  onCancel,
  saving = false,
  mode = 'create'
}: ArticleEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [published, setPublished] = useState(initialPublished);
  const [tagInput, setTagInput] = useState('');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  // 处理标签添加
  const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag) && tags.length < 10) {
        setTags([...tags, newTag]);
        setTagInput('');
      }
    }
  }, [tagInput, tags]);

  // 删除标签
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  }, [tags]);

  // 自动生成摘要
  const generateExcerpt = useCallback(() => {
    if (!content) return;
    
    // 移除Markdown标记，获取纯文本
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // 移除标题标记
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
      .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
      .replace(/`(.*?)`/g, '$1') // 移除代码标记
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 移除图片
      .replace(/\n/g, ' ') // 将换行替换为空格
      .trim();

    // 截取前200字符作为摘要
    const generatedExcerpt = plainText.length > 200 
      ? plainText.substring(0, 197) + '...'
      : plainText;
      
    setExcerpt(generatedExcerpt);
  }, [content]);

  // 检查是否可以发布
  const canPublishArticle = useCallback(() => {
    const articleData = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim()
    };
    return canPublish(articleData);
  }, [title, content, excerpt]);

  // 保存草稿
  const handleSaveDraft = useCallback(async () => {
    if (!title.trim()) {
      alert('请输入文章标题');
      return;
    }
    if (!content.trim()) {
      alert('请输入文章内容');
      return;
    }

    console.log('保存草稿:', {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim(),
      tags,
      published: false
    });

    await onSave({
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim(),
      tags,
      published: false
    });
  }, [title, content, excerpt, tags, onSave]);

  // 发布文章
  const handlePublish = useCallback(async () => {
    const { allowed, reason } = canPublishArticle();
    if (!allowed) {
      alert(`无法发布文章：${reason}`);
      return;
    }

    console.log('发布文章:', {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim(),
      tags,
      published: true
    });

    await onSave({
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim(),
      tags,
      published: true
    });
  }, [title, content, excerpt, tags, onSave, canPublishArticle]);

  // 处理发布确认
  const handlePublishClick = useCallback(() => {
    const { allowed, reason } = canPublishArticle();
    if (!allowed) {
      alert(`无法发布文章：${reason}`);
      return;
    }
    setShowPublishConfirm(true);
  }, [canPublishArticle]);

  // 确认发布
  const confirmPublish = useCallback(() => {
    setShowPublishConfirm(false);
    handlePublish();
  }, [handlePublish]);

  // 取消发布
  const cancelPublish = useCallback(() => {
    setShowPublishConfirm(false);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* 文章标题 */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          📝 文章标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请输入文章标题..."
          className="w-full px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-base sm:text-sm"
          maxLength={500}
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {title.length}/500
        </div>
      </div>

      {/* Markdown编辑器 */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ✍️ 文章内容 <span className="text-red-500">*</span>
        </label>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <MdEditor
            modelValue={content}
            onChange={setContent}
            language="zh-CN"
            theme="light"
            previewTheme="default"
            codeTheme="atom"
            style={{ height: window.innerWidth < 768 ? '400px' : '500px' }}
            toolbars={[
              'bold',
              'underline',
              'italic',
              '-',
              'title',
              'strikeThrough',
              'sub',
              'sup',
              'quote',
              'unorderedList',
              'orderedList',
              '-',
              'codeRow',
              'code',
              'link',
              'image',
              'table',
              'mermaid',
              'katex',
              '-',
              'revoke',
              'next',
              '=',
              'pageFullscreen',
              'fullscreen',
              'preview',
              'previewOnly'
            ]}
          />
        </div>
      </div>

      {/* 文章摘要 */}
            {/* 文章摘要 */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            📄 文章摘要
          </label>
          <button
            type="button"
            onClick={generateExcerpt}
            className="self-start sm:self-auto text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md transition-colors"
          >
            ✨ 自动生成
          </button>
        </div>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="请输入文章摘要（可选，用于搜索结果显示）..."
          className="w-full px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none text-base sm:text-sm"
          rows={3}
          maxLength={1000}
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {excerpt.length}/1000
        </div>
      </div>

      {/* 标签管理 */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          🏷️ 文章标签
        </label>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 sm:ml-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 text-base leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="输入标签后按回车或逗号添加..."
          className="w-full px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-base sm:text-sm"
          disabled={tags.length >= 10}
        />
        <div className="text-xs text-gray-500 mt-1">
          {tags.length}/10 个标签
        </div>
      </div>

      {/* 发布状态 */}
      <div className="mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            文章状态
          </h3>
          
          {/* 状态指示器 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              当前状态：
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              published 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            }`}>
              {published ? '已发布' : '草稿'}
            </span>
          </div>

          {/* 发布状态切换 */}
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                发布文章
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {published 
                ? '文章将保存为已发布状态，仅作者可见' 
                : '文章将保存为草稿，仅作者可见'}
            </p>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-600">
        <div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              disabled={saving}
            >
              取消
            </button>
          )}
        </div>
        
        <div className="space-x-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存草稿'}
          </button>
          
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : (mode === 'edit' ? '更新并发布' : '发布文章')}
          </button>
        </div>
      </div>

      {/* 发布确认对话框 */}
      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              确认发布文章
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              文章将保存为已发布状态。请确保内容完整且符合规范。
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
    </div>
  );
}
