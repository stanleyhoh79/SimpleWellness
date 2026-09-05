'use client';

import {
  Activity,
  ArrowRight,
  BookOpenText,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Coffee,
  HeartPulse,
  Home as HomeIcon,
  Info,
  Leaf,
  LogIn,
  Menu,
  MessageCircle,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Ruler,
  Sparkles,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react';
import { createElement, useEffect, useState } from 'react';

import {
  loadPublishedHomeContent,
  signInWithGoogle,
  signOutOfFirebase,
  subscribeToAuth,
} from '@/lib/firebase';
import {
  defaultHomeContent,
  type ContentPage,
  type HomeContent,
  type MediaAsset,
  type NavItem,
} from '@/lib/content-model';

const iconMap: Record<string, LucideIcon> = {
  activity: Activity,
  book: BookOpenText,
  check: Check,
  cup: Coffee,
  home: HomeIcon,
  info: Info,
  leaf: Leaf,
  moon: Moon,
  ruler: Ruler,
  sparkles: Sparkles,
  utensils: Utensils,
  user: CircleUserRound,
};

function getNavIcon(name: string) {
  return iconMap[name] ?? HeartPulse;
}

function IconRenderer({
  name,
  size,
  strokeWidth,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
}) {
  return createElement(getNavIcon(name), { size, strokeWidth });
}

function whatsappHref(number: string) {
  return `https://wa.me/${number.replace(/\D/g, '')}`;
}

function pageHref(item: NavItem) {
  if (!item.pageId) return item.href;
  const page = encodeURIComponent(item.pageId);
  const block = item.blockId ? `&block=${encodeURIComponent(item.blockId)}` : '';
  return `#page=${page}${block}`;
}

function readPageHash() {
  if (typeof window === 'undefined') return { pageId: 'overview', blockId: undefined };
  const hash = window.location.hash.replace(/^#/, '');
  if (hash.startsWith('page=')) {
    const params = new URLSearchParams(hash);
    return {
      pageId: params.get('page') || 'overview',
      blockId: params.get('block') || undefined,
    };
  }
  if (hash && hash !== 'top') return { pageId: hash, blockId: undefined };
  return { pageId: 'overview', blockId: undefined };
}

function MediaPreview({ asset }: { asset?: MediaAsset }) {
  if (!asset) {
    return <div className="content-media-missing">这个内容区块还没有绑定媒体。</div>;
  }
  if (asset.type.startsWith('video/')) {
    return (
      <video className="content-media" src={asset.url} controls preload="metadata">
        <track kind="captions" label="中文" srcLang="zh" src="data:text/vtt,WEBVTT" />
      </video>
    );
  }
  // Firebase Storage URLs are dynamic, so Next Image cannot optimize them without a configured loader.
  // oxlint-disable-next-line next/no-img-element
  return <img className="content-media" src={asset.url} alt={asset.name} />;
}

function IndependentPage({
  page,
  mediaLibrary,
  activeBlockId,
}: {
  page: ContentPage;
  mediaLibrary: MediaAsset[];
  activeBlockId?: string;
}) {
  return (
    <section className="independent-page" aria-labelledby="independent-page-title">
      <div className="independent-page-header">
        <p className="section-kicker">{page.eyebrow}</p>
        <h1 id="independent-page-title">{page.title}</h1>
        <p>{page.description}</p>
      </div>
      {page.blocks.length ? (
        <div className="content-block-grid">
          {page.blocks.map((block) => (
            <article className={`content-block-card ${activeBlockId === block.id ? 'is-selected' : ''}`} id={block.id} key={block.id}>
              <p className="card-eyebrow">{block.eyebrow}</p>
              <h2>{block.title}</h2>
              <p>{block.body}</p>
              {block.type === 'media' ? <MediaPreview asset={mediaLibrary.find((asset) => asset.id === block.mediaId)} /> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-content-block">这个内容页还在整理中，欢迎先通过 WhatsApp 联系我们。</div>
      )}
    </section>
  );
}

function NavigationItem({
  item,
  collapsed,
  activeId,
  onSelect,
}: {
  item: NavItem;
  collapsed: boolean;
  activeId: string;
  onSelect: (item: NavItem, event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const hasChildren = Boolean(item.children?.length);
  const [open, setOpen] = useState(true);

  return (
    <li className="nav-item">
      <div className={`nav-row ${activeId === item.id ? 'is-active' : ''}`}>
        <a
          className="nav-link"
          href={pageHref(item)}
          onClick={(event) => onSelect(item, event)}
          title={collapsed ? item.label : undefined}
        >
          <IconRenderer name={item.icon} size={18} strokeWidth={1.8} />
          <span className="nav-label">{item.label}</span>
        </a>
        {hasChildren && !collapsed ? (
          <button
            type="button"
            className="nav-expand"
            aria-label={`${open ? '收起' : '展开'}${item.label}`}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        ) : null}
      </div>
      {hasChildren && open && !collapsed ? (
        <ul className="nav-submenu">
          {item.children?.map((child) => (
            <NavigationItem
              key={child.id}
              item={child}
              collapsed={collapsed}
              activeId={activeId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function Home() {
  const [content, setContent] = useState<HomeContent>(defaultHomeContent);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeId, setActiveId] = useState('overview');
  const initialPage = readPageHash();
  const [currentPageId, setCurrentPageId] = useState(initialPage.pageId);
  const [currentBlockId, setCurrentBlockId] = useState<string | undefined>(initialPage.blockId);
  const [user, setUser] = useState<import('firebase/auth').User | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    const handleHashChange = () => {
      const nextPage = readPageHash();
      setCurrentPageId(nextPage.pageId);
      setCurrentBlockId(nextPage.blockId);
    };
    window.addEventListener('hashchange', handleHashChange);
    void loadPublishedHomeContent().then((nextContent) => {
      if (mounted) setContent(nextContent);
    });
    const unsubscribe = subscribeToAuth((nextUser) => {
      if (mounted) setUser(nextUser);
    });
    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleSignIn = async () => {
    setAuthBusy(true);
    setAuthMessage('');
    try {
      await signInWithGoogle();
    } catch {
      setAuthMessage('登录没有完成，请稍后再试。');
    } finally {
      setAuthBusy(false);
    }
  };

  const navigateToPage = (pageId: string, blockId?: string) => {
    setCurrentPageId(pageId);
    setCurrentBlockId(blockId);
    const block = blockId ? `&block=${encodeURIComponent(blockId)}` : '';
    window.history.replaceState(null, '', `#page=${encodeURIComponent(pageId)}${block}`);
  };

  const handleSelect = (item: NavItem, event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setActiveId(item.id);
    navigateToPage(item.pageId ?? item.id, item.blockId);
    setMobileNavOpen(false);
  };

  const activePage = content.pages.find((page) => page.id === currentPageId);

  return (
    <div className="site-shell" id="top">
      <aside className={`site-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileNavOpen ? 'is-mobile-open' : ''}`}>
        <div className="sidebar-topline">
          <a
            className="brand-mark"
            href="#top"
            aria-label={`${content.brandName}首页`}
            onClick={(event) => {
              event.preventDefault();
              setActiveId('overview');
              navigateToPage('overview');
            }}
          >
            <span>{content.brandMark}</span>
            <strong>{content.brandName}</strong>
          </a>
          <button
            type="button"
            className="sidebar-toggle mobile-only"
            aria-label="关闭导航"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-scroll">
          <p className="sidebar-kicker">探索平台</p>
          <nav aria-label="公众首页导航">
            <ul className="nav-list">
              {content.nav.map((item) => (
                <NavigationItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  activeId={activeId}
                  onSelect={handleSelect}
                />
              ))}
            </ul>
          </nav>
        </div>

        <div className="sidebar-footer">
          <a className="sidebar-help" href={whatsappHref(content.whatsappNumber)} target="_blank" rel="noreferrer">
            <MessageCircle size={18} />
            <span>WhatsApp 咨询</span>
          </a>
          <button
            type="button"
            className="sidebar-collapse"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? '展开导航' : '折叠导航'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span>{collapsed ? '展开导航' : '折叠导航'}</span>
          </button>
        </div>
      </aside>

      {mobileNavOpen ? (
        <button
          type="button"
          className="mobile-backdrop"
          aria-label="关闭导航"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <div className="site-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu-button"
              aria-label="打开导航"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="topbar-eyebrow">{activePage?.eyebrow ?? '公众首页'}</p>
              <p className="topbar-title">{activePage?.title ?? '回到适合自己的养生节奏'}</p>
            </div>
          </div>
          <div className="topbar-actions">
            <a className="topbar-whatsapp" href={whatsappHref(content.whatsappNumber)} target="_blank" rel="noreferrer">
              <MessageCircle size={17} />
              <span>WhatsApp 咨询</span>
            </a>
            {user ? (
              <button type="button" className="profile-button" onClick={() => void signOutOfFirebase()}>
                <CircleUserRound size={18} />
                <span>退出登录</span>
              </button>
            ) : (
              <button type="button" className="login-button" onClick={() => void handleSignIn()} disabled={authBusy}>
                <LogIn size={17} />
                <span>{authBusy ? '登录中…' : '会员登录'}</span>
              </button>
            )}
          </div>
        </header>

        {authMessage ? <output className="auth-message">{authMessage}</output> : null}

        <main className="content-area">
          {currentPageId === 'overview' || !activePage ? (
            <>
          <section className="hero-section" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow"><Sparkles size={15} /> {content.heroEyebrow}</p>
              <h1 id="hero-title">{content.heroTitle}</h1>
              <p className="hero-description">{content.heroDescription}</p>
              <div className="hero-actions">
                <a
                  className="button button-primary"
                  href="#page=methods"
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveId('methods');
                    navigateToPage('methods');
                  }}
                >
                  {content.heroCtaLabel}
                  <ArrowRight size={17} />
                </a>
                <a
                  className="button button-quiet"
                  href="#page=member-space"
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveId('member-space');
                    navigateToPage('member-space');
                  }}
                >
                  进入会员空间
                </a>
              </div>
              <div className="hero-note">
                <HeartPulse size={17} />
                <span>不追求一次改变全部，先从今天能做到的一件小事开始。</span>
              </div>
            </div>
            <div className="hero-panel" aria-label="今日养生提示">
              <div className="hero-panel-orbit orbit-one" />
              <div className="hero-panel-orbit orbit-two" />
              <div className="hero-panel-content">
                <div className="panel-icon"><Leaf size={23} /></div>
                <p className="panel-label">今日先做一件小事</p>
                <h2>把节奏放慢<br />让身体听见你。</h2>
                <div className="panel-divider" />
                <div className="panel-meta"><Clock3 size={16} /><span>给自己留出 10 分钟</span></div>
              </div>
            </div>
          </section>

          <section className="intro-strip" aria-label="平台简介">
            <div className="intro-stat"><strong>01</strong><span>看懂自己的日常</span></div>
            <div className="intro-stat"><strong>02</strong><span>选择可以坚持的方法</span></div>
            <div className="intro-stat"><strong>03</strong><span>记录变化，慢慢调整</span></div>
          </section>

          <section className="section-block" id="methods" aria-labelledby="methods-title">
            <div className="section-heading">
              <div><p className="section-kicker">从日常开始</p><h2 id="methods-title">适合自己的方法，才是好方法</h2></div>
              <p>把养生拆成清楚、温和、能够重复的小动作。你可以从任意一个入口开始。</p>
            </div>
            <div className="method-grid">
              {content.methodCards.map((card) => {
                return (
                  <article className="method-card" key={card.id} id={card.id}>
                    <div className="card-icon"><IconRenderer name={card.icon} size={20} /></div>
                    <p className="card-eyebrow">{card.eyebrow}</p>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                    <a href="#member-space" className="card-link">了解更多 <ArrowRight size={15} /></a>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="resource-section" id="resources" aria-labelledby="resource-title">
            <div className="resource-copy">
              <p className="section-kicker">草本饮品</p>
              <h2 id="resource-title">从熟悉的味道，认识日常的照顾。</h2>
              <p>平台会逐步整理饮品、食材和冲泡方法，让每一次选择都有清楚的依据，也保留自己的观察空间。</p>
              <a className="text-link" href={whatsappHref(content.whatsappNumber)} target="_blank" rel="noreferrer">咨询平台顾问 <ArrowRight size={16} /></a>
            </div>
            <div className="resource-list">
              <div className="resource-item"><span>01</span><div><strong>认识材料</strong><p>从日常可理解的内容开始。</p></div></div>
              <div className="resource-item"><span>02</span><div><strong>学会冲泡</strong><p>找到适合自己的简单方法。</p></div></div>
              <div className="resource-item"><span>03</span><div><strong>记录感受</strong><p>把变化留给时间，也留给自己。</p></div></div>
            </div>
          </section>

          <section className="member-section" id="member-space" aria-labelledby="member-title">
            <div className="member-icon"><CircleUserRound size={25} /></div>
            <div><p className="section-kicker">会员空间</p><h2 id="member-title">为自己保留一块可以持续的地方</h2><p>会员中心将逐步接入每日执行和每周测量，帮助你记录过程，而不是追赶结果。</p></div>
            <button className="button button-primary" type="button" onClick={() => void handleSignIn()} disabled={authBusy}>{user ? '已进入会员状态' : '使用 Google 登录'} <ArrowRight size={17} /></button>
          </section>

          <section className="about-section" id="about" aria-labelledby="about-title">
            <div><p className="section-kicker">关于平台</p><h2 id="about-title">让养生回到生活本身。</h2></div>
            <p>极简养生是一个持续扩展的生活方式平台。我们把内容、记录和服务分成清晰的模块，让每一次调整都更容易理解，也更容易继续。</p>
          </section>
            </>
          ) : (
            <IndependentPage page={activePage} mediaLibrary={content.mediaLibrary} activeBlockId={currentBlockId} />
          )}
        </main>

        <footer className="site-footer">
          <span>© {new Date().getFullYear()} {content.brandName}</span>
          <span>内容仅供一般健康生活参考，不替代专业医疗意见。</span>
          <a href={whatsappHref(content.whatsappNumber)} target="_blank" rel="noreferrer">WhatsApp 咨询</a>
        </footer>
      </div>
    </div>
  );
}
