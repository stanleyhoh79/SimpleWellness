'use client';

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LogIn,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import Link from 'next/link';

import {
  ADMIN_EMAIL,
  firebaseErrorMessage,
  loadHomeContentVersion,
  publishHomeContent,
  saveHomeDraft,
  signInWithGoogle,
  signOutOfFirebase,
  subscribeToAuth,
  uploadPublicMedia,
} from '@/lib/firebase';
import {
  cloneHomeContent,
  defaultHomeContent,
  type ContentBlock,
  type ContentPage,
  type HomeContent,
  type NavItem,
} from '@/lib/content-model';

function updateNavTree(items: NavItem[], id: string, update: (item: NavItem) => NavItem): NavItem[] {
  return items.map((item) => ({
    ...update(item.id === id ? item : item),
    children: item.children ? updateNavTree(item.children, id, update) : undefined,
  }));
}

function removeNavItem(items: NavItem[], id: string): NavItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({ ...item, children: item.children ? removeNavItem(item.children, id) : undefined }));
}

function addChildToNav(items: NavItem[], parentId: string, child: NavItem): NavItem[] {
  return items.map((item) => {
    if (item.id === parentId) return { ...item, children: [...(item.children ?? []), child] };
    return { ...item, children: item.children ? addChildToNav(item.children, parentId, child) : undefined };
  });
}

function moveNavItem(items: NavItem[], id: string, direction: -1 | 1): NavItem[] {
  const index = items.findIndex((item) => item.id === id);
  if (index >= 0) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return items;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    return next;
  }
  return items.map((item) => ({ ...item, children: item.children ? moveNavItem(item.children, id, direction) : undefined }));
}

function fieldValue(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
  return event.target.value;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<HomeContent>(cloneHomeContent(defaultHomeContent));
  const [busy, setBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => subscribeToAuth(setUser), []);

  useEffect(() => {
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return;
    void loadHomeContentVersion('draft').then((draft) => setContent(cloneHomeContent(draft)));
  }, [user]);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const updateNav = (id: string, patch: Partial<NavItem>) => {
    setContent((current) => ({
      ...current,
      nav: updateNavTree(current.nav, id, (item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const addRootNav = () => {
    const id = `custom-${Date.now()}`;
    setContent((current) => ({
      ...current,
      nav: [...current.nav, { id, label: '新入口', href: '#', icon: 'sparkles', children: [] }],
    }));
  };

  const addChild = (parentId: string) => {
    const id = `custom-child-${Date.now()}`;
    setContent((current) => ({
      ...current,
      nav: addChildToNav(current.nav, parentId, { id, label: '新子入口', href: '#', icon: 'sparkles' }),
    }));
  };

  const removeNav = (id: string) => {
    setContent((current) => ({ ...current, nav: removeNavItem(current.nav, id) }));
  };

  const moveNav = (id: string, direction: -1 | 1) => {
    setContent((current) => ({ ...current, nav: moveNavItem(current.nav, id, direction) }));
  };

  const updatePage = (pageId: string, patch: Partial<ContentPage>) => {
    setContent((current) => ({
      ...current,
      pages: current.pages.map((page) => (page.id === pageId ? { ...page, ...patch } : page)),
    }));
  };

  const updatePageBlock = (pageId: string, blockId: string, patch: Partial<ContentBlock>) => {
    setContent((current) => ({
      ...current,
      pages: current.pages.map((page) => page.id !== pageId ? page : {
        ...page,
        blocks: page.blocks.map((block) => block.id === blockId ? { ...block, ...patch } : block),
      }),
    }));
  };

  const addPageBlock = (pageId: string) => {
    const id = `${pageId}-block-${Date.now()}`;
    setContent((current) => ({
      ...current,
      pages: current.pages.map((page) => page.id !== pageId ? page : {
        ...page,
        blocks: [...page.blocks, { id, type: 'text', eyebrow: '新内容', title: '新内容区块', body: '' }],
      }),
    }));
  };

  const removePageBlock = (pageId: string, blockId: string) => {
    setContent((current) => ({
      ...current,
      pages: current.pages.map((page) => page.id !== pageId ? page : {
        ...page,
        blocks: page.blocks.filter((block) => block.id !== blockId),
      }),
    }));
  };

  const saveDraft = async () => {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      await saveHomeDraft(content, user);
      setStatus('草稿已保存。公众首页仍显示已发布版本。');
    } catch (caught) {
      setError(firebaseErrorMessage(caught, '草稿保存失败。'));
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      await publishHomeContent(content, user);
      setStatus('内容已发布到公众首页。');
    } catch (caught) {
      setError(firebaseErrorMessage(caught, '发布失败。'));
    } finally {
      setBusy(false);
    }
  };

  const uploadMedia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setBusy(true);
    setError('');
    try {
      const url = await uploadPublicMedia(file, user);
      setContent((current) => ({
        ...current,
        mediaLibrary: [
          ...current.mediaLibrary,
          { id: `media-${Date.now()}`, name: file.name, url, type: file.type, uploadedAt: new Date().toISOString() },
        ],
      }));
      setStatus('媒体已上传。保存草稿后会记录到内容版本中。');
    } catch (caught) {
      setError(firebaseErrorMessage(caught, '媒体上传失败。'));
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  const handleSignIn = async () => {
    setAuthBusy(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (caught) {
      setError(firebaseErrorMessage(caught, 'Google 登录失败。'));
    } finally {
      setAuthBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="admin-brand"><span>简</span><strong>极简养生管理后台</strong></div>
          <h1>管理公众首页</h1>
          <p>使用已授权的 Google 管理员账号进入内容编辑和媒体管理。</p>
          {error ? <p className="access-denied">{error}</p> : null}
          <button className="button button-primary" type="button" onClick={() => void handleSignIn()} disabled={authBusy}>
            <LogIn size={17} /> {authBusy ? '登录中…' : '使用 Google 登录'}
          </button>
          <p className="admin-login-hint">管理员：{ADMIN_EMAIL}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="admin-brand"><span>简</span><strong>极简养生管理后台</strong></div>
          <h1>暂未授权</h1>
          <p className="access-denied">当前账号不是初始管理员账号。</p>
          <div className="editor-actions"><button className="button button-quiet" type="button" onClick={() => void signOutOfFirebase()}><X size={16} /> 退出登录</button><Link className="button button-primary" href="/"><ArrowLeft size={16} /> 返回首页</Link></div>
        </div>
      </div>
    );
  }

  const renderNavItem = (item: NavItem, depth = 0): React.ReactNode => (
    <div className="nav-editor-item" key={item.id} style={{ marginLeft: depth ? '.6rem' : undefined }}>
      <div className="nav-editor-row">
        <input aria-label="导航名称" value={item.label} onChange={(event) => updateNav(item.id, { label: fieldValue(event) })} />
        <input aria-label="导航链接" value={item.href} onChange={(event) => updateNav(item.id, { href: fieldValue(event) })} />
        <div className="nav-editor-tools">
          <button className="icon-button" type="button" aria-label="上移" onClick={() => moveNav(item.id, -1)}><ChevronUp size={15} /></button>
          <button className="icon-button" type="button" aria-label="下移" onClick={() => moveNav(item.id, 1)}><ChevronDown size={15} /></button>
          <button className="icon-button" type="button" aria-label="新增子入口" onClick={() => addChild(item.id)}><Plus size={15} /></button>
          <button className="icon-button danger" type="button" aria-label="删除入口" onClick={() => removeNav(item.id)}><Trash2 size={15} /></button>
        </div>
      </div>
      <div className="nav-editor-routing">
        <label>独立内容页 ID<input value={item.pageId ?? ''} onChange={(event) => updateNav(item.id, { pageId: fieldValue(event) || undefined })} placeholder="例如 methods" /></label>
        <label>内容区块 ID<input value={item.blockId ?? ''} onChange={(event) => updateNav(item.id, { blockId: fieldValue(event) || undefined })} placeholder="例如 food" /></label>
      </div>
      {item.children?.length ? <div className="nav-editor-children"><div className="nav-editor-child-label">子导航</div>{item.children.map((child) => renderNavItem(child, depth + 1))}</div> : null}
    </div>
  );

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link className="admin-brand" href="/"><span>简</span><strong>极简养生管理后台</strong></Link>
        <div className="admin-actions"><Link className="admin-link" href="/" target="_blank">查看公众首页 <ExternalLink size={14} /></Link><button className="button button-quiet" type="button" onClick={() => void signOutOfFirebase()}>退出登录</button></div>
      </header>
      <main className="admin-main">
        <div className="admin-heading"><div><p className="section-kicker">Content studio</p><h1>编辑公众首页</h1></div><p>内容、导航和媒体都采用可迁移的版本化结构，先保存草稿，再发布到公众页面。</p></div>
        <div className="editor-grid">
          <div>
            <section className="editor-card">
              <h2>首页内容</h2><p>编辑完成后可先保存草稿，确认无误再发布。</p>
              <div className="field-grid">
                <div className="field-grid two"><label className="field-label">品牌名称<input value={content.brandName} onChange={(event) => setContent((current) => ({ ...current, brandName: fieldValue(event) }))} /></label><label className="field-label">品牌标记<input value={content.brandMark} onChange={(event) => setContent((current) => ({ ...current, brandMark: fieldValue(event) }))} /></label></div>
                <label className="field-label">首屏眉题<input value={content.heroEyebrow} onChange={(event) => setContent((current) => ({ ...current, heroEyebrow: fieldValue(event) }))} /></label>
                <label className="field-label">首屏标题<input value={content.heroTitle} onChange={(event) => setContent((current) => ({ ...current, heroTitle: fieldValue(event) }))} /></label>
                <label className="field-label">首屏说明<textarea value={content.heroDescription} onChange={(event) => setContent((current) => ({ ...current, heroDescription: fieldValue(event) }))} /></label>
                <div className="field-grid two"><label className="field-label">按钮文字<input value={content.heroCtaLabel} onChange={(event) => setContent((current) => ({ ...current, heroCtaLabel: fieldValue(event) }))} /></label><label className="field-label">WhatsApp 电话<input value={content.whatsappNumber} onChange={(event) => setContent((current) => ({ ...current, whatsappNumber: fieldValue(event) }))} /></label></div>
              </div>
              <div className="editor-divider" />
              <h2>养生方法卡片</h2><p>首页三个方法卡片可以替换为你准备的内容。</p>
              <div className="field-grid">{content.methodCards.map((card, index) => <div className="editor-card" key={card.id}><label className="field-label">眉题<input value={card.eyebrow} onChange={(event) => setContent((current) => ({ ...current, methodCards: current.methodCards.map((item, itemIndex) => itemIndex === index ? { ...item, eyebrow: fieldValue(event) } : item) }))} /></label><label className="field-label">标题<input value={card.title} onChange={(event) => setContent((current) => ({ ...current, methodCards: current.methodCards.map((item, itemIndex) => itemIndex === index ? { ...item, title: fieldValue(event) } : item) }))} /></label><label className="field-label">说明<textarea value={card.body} onChange={(event) => setContent((current) => ({ ...current, methodCards: current.methodCards.map((item, itemIndex) => itemIndex === index ? { ...item, body: fieldValue(event) } : item) }))} /></label></div>)}</div>
            </section>
            <section className="editor-card">
              <h2>独立内容页与媒体绑定</h2>
              <p>导航会打开右侧独立内容页。每个内容区块都可以选择文字或媒体，并从媒体库绑定图片/视频。</p>
              <div className="page-editor-list">
                {content.pages.map((page) => (
                  <details className="page-editor" key={page.id} open>
                    <summary>{page.title}<span>{page.id}</span></summary>
                    <div className="field-grid">
                      <label className="field-label">页面 ID<input value={page.id} readOnly /></label>
                      <div className="field-grid two">
                        <label className="field-label">页面眉题<input value={page.eyebrow} onChange={(event) => updatePage(page.id, { eyebrow: fieldValue(event) })} /></label>
                        <label className="field-label">页面标题<input value={page.title} onChange={(event) => updatePage(page.id, { title: fieldValue(event) })} /></label>
                      </div>
                      <label className="field-label">页面说明<textarea value={page.description} onChange={(event) => updatePage(page.id, { description: fieldValue(event) })} /></label>
                      <div className="content-block-editor-list">
                        {page.blocks.map((block) => (
                          <div className="content-block-editor" key={block.id}>
                            <div className="content-block-editor-heading"><strong>内容区块：{block.id}</strong><button className="icon-button danger" type="button" aria-label="删除内容区块" onClick={() => removePageBlock(page.id, block.id)}><Trash2 size={15} /></button></div>
                            <div className="field-grid two">
                              <label className="field-label">区块眉题<input value={block.eyebrow} onChange={(event) => updatePageBlock(page.id, block.id, { eyebrow: fieldValue(event) })} /></label>
                              <label className="field-label">区块标题<input value={block.title} onChange={(event) => updatePageBlock(page.id, block.id, { title: fieldValue(event) })} /></label>
                            </div>
                            <label className="field-label">区块说明<textarea value={block.body} onChange={(event) => updatePageBlock(page.id, block.id, { body: fieldValue(event) })} /></label>
                            <div className="field-grid two">
                              <label className="field-label">内容类型<select value={block.type} onChange={(event) => updatePageBlock(page.id, block.id, { type: event.target.value === 'media' ? 'media' : 'text' })}><option value="text">文字</option><option value="media">图片/视频</option></select></label>
                              <label className="field-label">绑定媒体<select value={block.mediaId ?? ''} onChange={(event) => updatePageBlock(page.id, block.id, { mediaId: event.target.value || undefined })}><option value="">暂不绑定</option>{content.mediaLibrary.map((asset) => <option value={asset.id} key={asset.id}>{asset.name}</option>)}</select></label>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="editor-actions"><button className="button button-quiet" type="button" onClick={() => addPageBlock(page.id)}><Plus size={16} /> 新增内容区块</button></div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
            <section className="editor-card">
              <h2>导航和子导航</h2><p>可新增、编辑、排序、删除一级入口和子入口。</p>
              <div className="nav-editor-list">{content.nav.map((item) => renderNavItem(item))}</div>
              <div className="editor-actions"><button className="button button-quiet" type="button" onClick={addRootNav}><Plus size={16} /> 新增一级入口</button></div>
            </section>
          </div>
          <div>
            <section className="editor-card">
              <h2>媒体库</h2><p>上传图片或视频到 Firebase Storage，地址会进入可迁移内容版本。</p>
              <div className="media-upload"><label className="field-label">选择文件<input type="file" accept="image/*,video/*" onChange={(event) => void uploadMedia(event)} disabled={busy} /></label><div className="editor-actions"><label className="button button-quiet"><Upload size={16} /> 上传图片/视频<input hidden type="file" accept="image/*,video/*" onChange={(event) => void uploadMedia(event)} disabled={busy} /></label></div></div>
              <div className="media-list">{content.mediaLibrary.length ? content.mediaLibrary.map((asset) => <div className="media-item" key={asset.id}><span>{asset.name}</span><a href={asset.url} target="_blank" rel="noreferrer">打开 <ExternalLink size={13} /></a></div>) : <p>还没有上传媒体。</p>}</div>
            </section>
            <section className="editor-card">
              <h2>发布控制</h2><p><ShieldCheck size={15} /> 当前账号已通过管理员邮箱校验：{user.email}</p>
              <div className="editor-actions"><button className="button button-quiet" type="button" onClick={() => void saveDraft()} disabled={busy}><Save size={16} /> {busy ? '处理中…' : '保存草稿'}</button><button className="button button-primary" type="button" onClick={() => void publish()} disabled={busy}><ShieldCheck size={16} /> 发布到首页</button></div>
              {status ? <output className="editor-status">{status}</output> : null}
              {error ? <div className="editor-status access-denied" role="alert">{error}</div> : null}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
