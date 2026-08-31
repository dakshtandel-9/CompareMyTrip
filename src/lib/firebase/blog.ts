import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";

import { normalizeBlogPost, sortBlogPosts, type BlogPost } from "@/lib/blogData";
import { uploadImageToCloudflare } from "@/lib/cloudflareUpload";
import { getFirebaseAuth, getFirebaseDb } from "./client";

const BLOG_COLLECTION = "blogPosts";

function requireUser() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to the CRM before changing blog posts.");
  return user;
}

const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Live feed of every post, drafts included — the CRM needs them and the
    website filters them out. Ordering is done here rather than in a
    Firestore query so a post with a missing date never disappears. */
export function subscribeToBlogPosts(
  onChange: (posts: BlogPost[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    collection(getFirebaseDb(), BLOG_COLLECTION),
    (snapshot) => {
      onChange(sortBlogPosts(snapshot.docs.map((item) => normalizeBlogPost(item.id, item.data().post))));
    },
    (error: { message: string }) => onError(error.message),
  );
}

export async function saveBlogPost(post: BlogPost) {
  const user = requireUser();
  await setDoc(
    doc(getFirebaseDb(), BLOG_COLLECTION, post.id),
    {
      post: clean(post),
      updatedAt: serverTimestamp(),
      updatedByUid: user.uid,
    },
    { merge: true },
  );
}

export async function deleteBlogPost(postId: string) {
  requireUser();
  await deleteDoc(doc(getFirebaseDb(), BLOG_COLLECTION, postId));
}

/** Images live in Cloudflare R2 under the CRM's `blog/` prefix; Firestore
    stores only their durable URL, exactly as packages do. */
export async function uploadBlogImage(file: File) {
  return uploadImageToCloudflare(file, "blog");
}

/** Writes the starter guides in one batch, skipping any slug that already
    exists so re-running it can never overwrite something the team wrote. */
export async function seedBlogPosts(posts: BlogPost[], existingIds: string[]) {
  const user = requireUser();
  const taken = new Set(existingIds);
  const fresh = posts.filter((post) => !taken.has(post.id));
  if (!fresh.length) return { added: 0, skipped: posts.length };

  const db = getFirebaseDb();
  const batch = writeBatch(db);
  fresh.forEach((post) => {
    batch.set(doc(db, BLOG_COLLECTION, post.id), {
      post: clean(post),
      updatedAt: serverTimestamp(),
      updatedByUid: user.uid,
    });
  });
  await batch.commit();
  return { added: fresh.length, skipped: posts.length - fresh.length };
}
