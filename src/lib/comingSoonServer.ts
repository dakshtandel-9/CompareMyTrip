/** A small public Firestore field read, without the Admin SDK in middleware. */
export async function readComingSoonEnabled(): Promise<boolean> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return false;

  try {
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/siteContent/homepage`);
    url.searchParams.set("mask.fieldPaths", "content.comingSoon.enabled");
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!response.ok) return false;
    const document = await response.json();
    return document?.fields?.content?.mapValue?.fields?.comingSoon?.mapValue?.fields?.enabled?.booleanValue === true;
  } catch {
    // An unavailable settings service must not strand the entire website.
    return false;
  }
}
