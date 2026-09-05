import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

import { defaultHomeContent, normalizeHomeContent, type HomeContent } from './content-model';

export const ADMIN_EMAIL = 'stanleyhoh79@gmail.com';

const FIREBASE_REQUEST_TIMEOUT_MS = 10000;

const firebaseConfig = {
  apiKey: 'AIzaSyDHeZ-19yFTjmkSqrlUDLrlhrNm7dwHVgk',
  authDomain: 'simplewellnessv1.firebaseapp.com',
  projectId: 'simplewellnessv1',
  storageBucket: 'simplewellnessv1.firebasestorage.app',
  messagingSenderId: '476819662665',
  appId: '1:476819662665:web:3e48b7d40af93b097f9c98',
};

let app: FirebaseApp | undefined;

export function getFirebaseApp() {
  if (app) return app;
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  return getFirebaseAuth().currentUser;
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (typeof window === 'undefined') return () => undefined;
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(getFirebaseAuth(), provider);
  return result.user;
}

export async function signOutOfFirebase() {
  await signOut(getFirebaseAuth());
}

export function firebaseErrorMessage(error: unknown, fallback = 'Firebase 请求失败，请稍后再试。') {
  const rawCode = typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: unknown }).code
    : undefined;
  const code = typeof rawCode === 'string' ? rawCode : '';
  const message = error instanceof Error ? error.message : '';

  if (code.includes('unauthorized-domain')) return '当前网站域名尚未加入 Firebase Authentication 的授权域名。';
  if (code.includes('permission-denied')) return 'Firebase 权限不足，请检查 Firestore/Storage Rules 和当前管理员账号。';
  if (code.includes('unavailable')) return 'Firebase 暂时不可用，请检查网络后重试。';
  if (code.includes('failed-precondition')) return 'Firebase 前置条件未满足，请检查项目配置。';
  if (message.includes('超时')) return message;
  return message || fallback;
}

function withFirebaseTimeout<T>(promise: Promise<T>, message: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), FIREBASE_REQUEST_TIMEOUT_MS);
    }),
  ]);
}

export async function loadHomeContentVersion(version: 'draft' | 'published'): Promise<HomeContent> {
  try {
    const snapshot = await withFirebaseTimeout(
      getDoc(doc(getFirestore(getFirebaseApp()), 'publicHomeContent', version)),
      '读取内容超时，当前显示本地默认内容。',
    );
    if (!snapshot.exists()) return defaultHomeContent;
    const data = snapshot.data();
    return normalizeHomeContent(data.content as Partial<HomeContent> | undefined);
  } catch {
    return defaultHomeContent;
  }
}

export async function loadPublishedHomeContent(): Promise<HomeContent> {
  return loadHomeContentVersion('published');
}

async function writeHomeContent(collection: 'draft' | 'published', content: HomeContent, user: User) {
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('当前账号没有管理员权限。');
  }
  await withFirebaseTimeout(
    setDoc(
      doc(getFirestore(getFirebaseApp()), 'publicHomeContent', collection),
      {
        content,
        updatedAt: serverTimestamp(),
        updatedBy: user.email,
        schemaVersion: 1,
      },
      { merge: true },
    ),
    '保存超时，请检查 Firebase Firestore Rules、网络和当前管理员账号。',
  );
}

export async function saveHomeDraft(content: HomeContent, user: User) {
  await writeHomeContent('draft', content, user);
}

export async function publishHomeContent(content: HomeContent, user: User) {
  await writeHomeContent('published', content, user);
  await writeHomeContent('draft', content, user);
}

export async function uploadPublicMedia(file: File, user: User) {
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('当前账号没有管理员权限。');
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const storageRef = ref(
    getStorage(getFirebaseApp()),
    `public-home/media/${Date.now()}-${safeName}`,
  );
  const uploaded = await withFirebaseTimeout(
    uploadBytes(storageRef, file, {
      contentType: file.type || undefined,
      customMetadata: { uploadedBy: user.email ?? ADMIN_EMAIL },
    }),
    '媒体上传超时，请检查 Firebase Storage Rules、网络和当前管理员账号。',
  );
  return withFirebaseTimeout(
    getDownloadURL(uploaded.ref),
    '媒体地址读取超时，请稍后重试。',
  );
}
