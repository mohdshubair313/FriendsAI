import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

/**
 * Cloudinary client wrapper.
 *
 * Configures the SDK once at module load using server-side env vars.
 * Exposes a single helper, `uploadImageBuffer`, that takes a raw image
 * buffer (e.g. from Cloudflare Workers AI's base64 response) and returns
 * a hosted CDN URL.
 *
 * Why Cloudinary?
 *   - Free tier is generous: 25 GB storage + 25 GB bandwidth/month — more
 *     than enough for an MVP doing ~hundreds of images per day.
 *   - On-the-fly transformations (resize, crop, format conversion) via
 *     URL params — no client-side processing needed.
 *   - Stable URLs — once uploaded, the image stays hosted; no expiring
 *     pre-signed URLs to refresh.
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

let configured = false;

function ensureConfigured() {
  if (configured) return;
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error(
      "Cloudinary not configured — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    );
  }
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
  configured = true;
}

export interface UploadResult {
  url: string;            // public CDN URL — what we save to MediaJob
  publicId: string;       // Cloudinary id, useful for future deletes
  width: number;
  height: number;
  bytes: number;
}

/**
 * Upload a raw image buffer to Cloudinary.
 *
 * Uses `upload_stream` so we can pipe a Buffer in directly without writing
 * a temp file. Folder is namespaced per-feature so generated images are
 * easy to clean up or audit.
 *
 * @param buffer  decoded image bytes (e.g. Buffer.from(base64, "base64"))
 * @param folder  Cloudinary folder ("friends-ai/generated-images" by default)
 */
export function uploadImageBuffer(
  buffer: Buffer,
  folder = "friends-ai/generated-images"
): Promise<UploadResult> {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "jpg",
      },
      (error, result?: UploadApiResponse) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary returned no result"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });
}
