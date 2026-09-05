export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  pageId?: string;
  blockId?: string;
  children?: NavItem[];
};

export type ContentCard = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: string;
};

export type MediaAsset = {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
};

export type ContentBlock = {
  id: string;
  type: 'text' | 'media';
  eyebrow: string;
  title: string;
  body: string;
  mediaId?: string;
};

export type ContentPage = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  blocks: ContentBlock[];
};

export type HomeContent = {
  brandName: string;
  brandMark: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroCtaLabel: string;
  whatsappNumber: string;
  nav: NavItem[];
  methodCards: ContentCard[];
  mediaLibrary: MediaAsset[];
  pages: ContentPage[];
};

export const defaultHomeContent: HomeContent = {
  brandName: '极简养生',
  brandMark: '简',
  heroEyebrow: '让日常回到自己的节奏',
  heroTitle: '把养生，做得简单一点。',
  heroDescription:
    '从一日三餐、身体活动和夜间休息开始，用清晰而温和的方式，陪你建立可以坚持的生活习惯。',
  heroCtaLabel: '认识养生方法',
  whatsappNumber: '+6017-6313216',
  nav: [
    { id: 'overview', label: '总览', href: '#top', icon: 'home', pageId: 'overview' },
    {
      id: 'methods',
      label: '养生方法',
      href: '#methods',
      icon: 'leaf',
      pageId: 'methods',
      children: [
        { id: 'food', label: '饮食节奏', href: '#food', icon: 'utensils', pageId: 'methods', blockId: 'food' },
        { id: 'movement', label: '身体活动', href: '#movement', icon: 'activity', pageId: 'methods', blockId: 'movement' },
        { id: 'rest', label: '夜间修复', href: '#rest', icon: 'moon', pageId: 'methods', blockId: 'rest' },
      ],
    },
    {
      id: 'resources',
      label: '草本饮品',
      href: '#resources',
      icon: 'cup',
      pageId: 'resources',
      children: [
        { id: 'ingredients', label: '日常饮品', href: '#resources', icon: 'sparkles', pageId: 'resources', blockId: 'ingredients' },
        { id: 'brewing', label: '冲泡方法', href: '#resources', icon: 'book', pageId: 'resources', blockId: 'brewing' },
      ],
    },
    {
      id: 'member-space',
      label: '会员空间',
      href: '#member-space',
      icon: 'user',
      pageId: 'member-space',
      children: [
        { id: 'daily', label: '每日执行', href: '#member-space', icon: 'check', pageId: 'member-space', blockId: 'daily' },
        { id: 'weekly', label: '每周测量', href: '#member-space', icon: 'ruler', pageId: 'member-space', blockId: 'weekly' },
      ],
    },
    { id: 'about', label: '关于平台', href: '#about', icon: 'info', pageId: 'about' },
  ],
  methodCards: [
    {
      id: 'food',
      eyebrow: '饮食节奏',
      title: '吃得清楚，也吃得安心',
      body: '从认识自己的饮食节奏开始，把复杂的选择变成每天都能做到的小行动。',
      icon: 'utensils',
    },
    {
      id: 'movement',
      eyebrow: '身体活动',
      title: '让身体慢慢动起来',
      body: '不追求一次改变全部，只为今天留出一点适合自己的活动时间。',
      icon: 'activity',
    },
    {
      id: 'rest',
      eyebrow: '夜间修复',
      title: '为睡眠留一盏灯',
      body: '把睡前的节奏放慢一点，让休息成为日常里可以被照顾的部分。',
      icon: 'moon',
    },
  ],
  mediaLibrary: [],
  pages: [
    {
      id: 'methods',
      eyebrow: '从日常开始',
      title: '适合自己的方法，才是好方法',
      description: '把养生拆成清楚、温和、能够重复的小动作。你可以从任意一个入口开始。',
      blocks: [
        { id: 'food', type: 'text', eyebrow: '饮食节奏', title: '吃得清楚，也吃得安心', body: '从认识自己的饮食节奏开始，把复杂的选择变成每天都能做到的小行动。' },
        { id: 'movement', type: 'text', eyebrow: '身体活动', title: '让身体慢慢动起来', body: '不追求一次改变全部，只为今天留出一点适合自己的活动时间。' },
        { id: 'rest', type: 'text', eyebrow: '夜间修复', title: '为睡眠留一盏灯', body: '把睡前的节奏放慢一点，让休息成为日常里可以被照顾的部分。' },
      ],
    },
    {
      id: 'resources',
      eyebrow: '草本饮品',
      title: '从熟悉的味道，认识日常的照顾。',
      description: '平台会逐步整理饮品、食材和冲泡方法，让每一次选择都有清楚的依据，也保留自己的观察空间。',
      blocks: [
        { id: 'ingredients', type: 'text', eyebrow: '01', title: '认识材料', body: '从日常可理解的内容开始。' },
        { id: 'brewing', type: 'text', eyebrow: '02', title: '学会冲泡', body: '找到适合自己的简单方法。' },
        { id: 'observe', type: 'text', eyebrow: '03', title: '记录感受', body: '把变化留给时间，也留给自己。' },
      ],
    },
    {
      id: 'member-space',
      eyebrow: '会员空间',
      title: '为自己保留一块可以持续的地方',
      description: '会员中心将逐步接入每日执行和每周测量，帮助你记录过程，而不是追赶结果。',
      blocks: [
        { id: 'daily', type: 'text', eyebrow: '每日执行', title: '今天完成一件小事', body: '会员中心会在后续版本接入可持续的每日记录。' },
        { id: 'weekly', type: 'text', eyebrow: '每周测量', title: '每周看见一点变化', body: '测量模块会以清楚、可迁移的数据结构逐步加入。' },
      ],
    },
    {
      id: 'about',
      eyebrow: '关于平台',
      title: '让养生回到生活本身。',
      description: '极简养生是一个持续扩展的生活方式平台。我们把内容、记录和服务分成清晰的模块，让每一次调整都更容易理解，也更容易继续。',
      blocks: [],
    },
  ],
};

function validString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function normalizeNavItem(item: Partial<NavItem>, fallback: NavItem): NavItem {
  return {
    id: validString(item.id, fallback.id),
    label: validString(item.label, fallback.label),
    href: validString(item.href, fallback.href),
    icon: validString(item.icon, fallback.icon),
    pageId: validString(item.pageId, fallback.pageId ?? fallback.id),
    blockId: typeof item.blockId === 'string' && item.blockId.trim() ? item.blockId : fallback.blockId,
    children: Array.isArray(item.children)
      ? item.children.map((child, index) =>
          normalizeNavItem(child, fallback.children?.[index] ?? fallback),
        )
      : undefined,
  };
}

export function normalizeHomeContent(value?: Partial<HomeContent>): HomeContent {
  const source = value ?? {};
  const nav = Array.isArray(source.nav)
    ? source.nav.map((item, index) =>
        normalizeNavItem(item, defaultHomeContent.nav[index] ?? defaultHomeContent.nav[0]),
      )
    : defaultHomeContent.nav;
  const methodCards = Array.isArray(source.methodCards)
    ? source.methodCards.map((card, index) => {
        const fallback = defaultHomeContent.methodCards[index] ?? defaultHomeContent.methodCards[0];
        return {
          id: validString(card.id, fallback.id),
          eyebrow: validString(card.eyebrow, fallback.eyebrow),
          title: validString(card.title, fallback.title),
          body: validString(card.body, fallback.body),
          icon: validString(card.icon, fallback.icon),
        };
      })
    : defaultHomeContent.methodCards;
  const mediaLibrary = Array.isArray(source.mediaLibrary)
    ? source.mediaLibrary.filter(
        (asset): asset is MediaAsset =>
          typeof asset === 'object' &&
          asset !== null &&
          typeof asset.id === 'string' &&
          typeof asset.name === 'string' &&
          typeof asset.url === 'string' &&
          typeof asset.type === 'string' &&
          typeof asset.uploadedAt === 'string',
      )
    : defaultHomeContent.mediaLibrary;
  const pages = Array.isArray(source.pages)
    ? source.pages.map((page, index) => {
        const fallback = defaultHomeContent.pages[index] ?? defaultHomeContent.pages[0];
        const blocks = Array.isArray(page.blocks)
          ? page.blocks.map((block, blockIndex) => {
              const blockFallback = fallback.blocks[blockIndex] ?? fallback.blocks[0] ?? {
                id: `${fallback.id}-block-${blockIndex + 1}`,
                type: 'text' as const,
                eyebrow: '内容',
                title: '新内容',
                body: '',
              };
              return {
                id: validString(block.id, blockFallback.id),
                type: block.type === 'media' ? 'media' as const : 'text' as const,
                eyebrow: validString(block.eyebrow, blockFallback.eyebrow),
                title: validString(block.title, blockFallback.title),
                body: validString(block.body, blockFallback.body),
                mediaId: typeof block.mediaId === 'string' ? block.mediaId : undefined,
              };
            })
          : fallback.blocks;
        return {
          id: validString(page.id, fallback.id),
          eyebrow: validString(page.eyebrow, fallback.eyebrow),
          title: validString(page.title, fallback.title),
          description: validString(page.description, fallback.description),
          blocks,
        };
      })
    : defaultHomeContent.pages;

  return {
    brandName: validString(source.brandName, defaultHomeContent.brandName),
    brandMark: validString(source.brandMark, defaultHomeContent.brandMark),
    heroEyebrow: validString(source.heroEyebrow, defaultHomeContent.heroEyebrow),
    heroTitle: validString(source.heroTitle, defaultHomeContent.heroTitle),
    heroDescription: validString(source.heroDescription, defaultHomeContent.heroDescription),
    heroCtaLabel: validString(source.heroCtaLabel, defaultHomeContent.heroCtaLabel),
    whatsappNumber: validString(source.whatsappNumber, defaultHomeContent.whatsappNumber),
    nav,
    methodCards,
    mediaLibrary,
    pages,
  };
}

export function cloneHomeContent(content: HomeContent = defaultHomeContent): HomeContent {
  return JSON.parse(JSON.stringify(content)) as HomeContent;
}
