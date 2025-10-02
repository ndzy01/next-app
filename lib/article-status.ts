export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

interface ArticleForValidation {
  id: string;
  title: string;
  content: string;
  published: boolean;
}

export interface ArticleStatusTransition {
  from: ArticleStatus;
  to: ArticleStatus;
  allowed: boolean;
  validation?: ((article: ArticleForValidation) => string | null) | null;
}

export interface ArticleStatusHistory {
  id: string;
  article_id: string;
  from_status: ArticleStatus;
  to_status: ArticleStatus;
  changed_by: string;
  reason?: string;
  created_at: Date;
}

// 状态转换规则
export const STATUS_TRANSITIONS: ArticleStatusTransition[] = [
  {
    from: ArticleStatus.DRAFT,
    to: ArticleStatus.PUBLISHED,
    allowed: true,
    validation: (article) => {
      if (!article.title?.trim()) {
        return '文章标题不能为空';
      }
      if (!article.content?.trim()) {
        return '文章内容不能为空';
      }
      if (article.title.length > 500) {
        return '文章标题不能超过500字符';
      }
      return null;
    }
  },
  {
    from: ArticleStatus.PUBLISHED,
    to: ArticleStatus.DRAFT,
    allowed: true,
    validation: null
  },
  {
    from: ArticleStatus.PUBLISHED,
    to: ArticleStatus.ARCHIVED,
    allowed: true,
    validation: null
  },
  {
    from: ArticleStatus.DRAFT,
    to: ArticleStatus.ARCHIVED,
    allowed: true,
    validation: null
  },
  {
    from: ArticleStatus.ARCHIVED,
    to: ArticleStatus.DRAFT,
    allowed: true,
    validation: null
  }
];

// 状态转换验证
export function validateStatusTransition(
  fromStatus: ArticleStatus,
  toStatus: ArticleStatus,
  article?: ArticleForValidation
): string | null {
  const transition = STATUS_TRANSITIONS.find(
    t => t.from === fromStatus && t.to === toStatus
  );

  if (!transition) {
    return `不允许从 ${fromStatus} 状态转换到 ${toStatus} 状态`;
  }

  if (!transition.allowed) {
    return `状态转换 ${fromStatus} → ${toStatus} 被禁止`;
  }

  if (transition.validation && article) {
    return transition.validation(article);
  }

  return null;
}

// 获取状态显示名称
export function getStatusDisplayName(status: ArticleStatus): string {
  const names = {
    [ArticleStatus.DRAFT]: '草稿',
    [ArticleStatus.PUBLISHED]: '已发布',
    [ArticleStatus.ARCHIVED]: '已归档'
  };
  return names[status];
}

// 获取状态颜色
export function getStatusColor(status: ArticleStatus): string {
  const colors = {
    [ArticleStatus.DRAFT]: 'yellow',
    [ArticleStatus.PUBLISHED]: 'green',
    [ArticleStatus.ARCHIVED]: 'gray'
  };
  return colors[status];
}

// 检查是否允许发布
export function canPublish(article: ArticleForValidation): { allowed: boolean; reason?: string } {
  const reason = validateStatusTransition(ArticleStatus.DRAFT, ArticleStatus.PUBLISHED, article);
  return {
    allowed: reason === null,
    reason: reason || undefined
  };
}

// 将布尔值转换为状态
export function booleanToStatus(published: boolean): ArticleStatus {
  return published ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT;
}

// 将状态转换为布尔值（向后兼容）
export function statusToBoolean(status: ArticleStatus): boolean {
  return status === ArticleStatus.PUBLISHED;
}
