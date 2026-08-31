import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

/* Every prefix the CRM owns in the bucket. Uploads outside this list are
   filed under packages, and deletes outside it are refused, so the route
   can never be pointed at another application's objects. */
const UPLOAD_FOLDERS = ["homepage", "packages", "blog", "destinations"] as const;
type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

function r2Config() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return null;
  return {
    bucket,
    publicUrl,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

async function isFirebaseAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!token || !apiKey || !projectId) return false;
  const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken: token }),
    cache: "no-store",
  });
  if (!authResponse.ok) return false;

  const authResult = await authResponse.json() as { users?: Array<{ localId?: string }> };
  const uid = authResult.users?.[0]?.localId;
  if (!uid) return false;

  const adminResponse = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/admins/${encodeURIComponent(uid)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  return adminResponse.ok;
}

export async function POST(request: Request) {
  if (!(await isFirebaseAdmin(request))) return Response.json({ error: "Not found." }, { status: 404 });

  const config = r2Config();
  if (!config) {
    return Response.json({ error: "Cloudflare R2 is not configured yet." }, { status: 503 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const requestedFolder = String(form.get("folder") ?? "");
  const folder = UPLOAD_FOLDERS.includes(requestedFolder as UploadFolder)
    ? (requestedFolder as UploadFolder)
    : "packages";
  if (!(file instanceof File) || !allowedTypes.has(file.type)) return Response.json({ error: "Choose a JPG, PNG or WebP image." }, { status: 400 });
  if (file.size > 5_000_000) return Response.json({ error: "Each image must be 5 MB or smaller." }, { status: 400 });

  const original = Buffer.from(await file.arrayBuffer());
  const shouldCompress = file.size >= 800_000;
  const body = shouldCompress
    ? await sharp(original)
        .rotate()
        .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 70 })
        .toBuffer()
    : original;
  const extension = shouldCompress ? "webp" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const contentType = shouldCompress ? "image/webp" : file.type;
  const key = `${folder}/${crypto.randomUUID()}.${extension}`;
  await config.client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return Response.json({ url: `${config.publicUrl}/${key}` });
}

export async function DELETE(request: Request) {
  if (!(await isFirebaseAdmin(request))) return Response.json({ error: "Not found." }, { status: 404 });
  const config = r2Config();
  if (!config) return Response.json({ error: "Cloudflare R2 is not configured yet." }, { status: 503 });

  const imageUrl = String((await request.json() as { url?: string }).url || "");
  let key = "";
  try {
    const image = new URL(imageUrl);
    const base = new URL(config.publicUrl);
    if (image.origin !== base.origin) return Response.json({ removed: false });
    key = decodeURIComponent(image.pathname).replace(/^\/+/, "");
  } catch { return Response.json({ error: "Invalid image URL." }, { status: 400 }); }
  if (!key || !UPLOAD_FOLDERS.some((folder) => key.startsWith(`${folder}/`))) {
    return Response.json({ error: "This image is not managed by the CRM." }, { status: 400 });
  }
  await config.client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
  return Response.json({ removed: true });
}
