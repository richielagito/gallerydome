import { v2 as cloudinary } from "cloudinary";
import { unstable_cache } from "next/cache";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const getGalleryImages = unstable_cache(
  async () => {
    try {
      const result = await cloudinary.search
        .expression(
          "folder:gallery-dome AND (resource_type:image OR resource_type:video)",
        )
        .with_field("context")
        .sort_by("created_at", "desc")
        .max_results(150) // Increased to show all images (dome has 150 slots)
        .execute();

      if (!result || !result.resources) {
        return [];
      }

      return result.resources.map((resource, i) => {
        let url = resource.secure_url;
        let previewUrl = url;
        const type = resource.resource_type;

        if (type === "video") {
          const parts = url.split("/upload/");
          // Limit video duration to 30 seconds using du_30 or e_trim
          url = `${parts[0]}/upload/f_auto,q_auto,w_1200,c_limit,du_30/${parts[1]}`;
          // For the preview, replace the extension with .webp and add animated flags. Limit preview to 30s as well if needed.
          const versionAndPath = parts[1];
          const basePath = versionAndPath.replace(/\.[^/.]+$/, "");
          previewUrl = `${parts[0]}/upload/f_webp,fl_animated,fl_awebp,q_auto,w_400,c_limit,du_30/${basePath}.webp`;
        } else {
          // Optimization: Apply q_auto, f_auto, and limit width to prevent massive downloads (timeouts)
          if (url.includes("/upload/") && !url.includes("q_auto")) {
            const parts = url.split("/upload/");
            url = `${parts[0]}/upload/q_auto,f_auto,w_1200,c_limit/${parts[1]}`;
            previewUrl = url;
          }

          // Compatibility: Force HEIC extension to JPG to avoid browser issues
          if (url.toLowerCase().endsWith(".heic")) {
            url = url.replace(/\.heic$/i, ".jpg");
            previewUrl = url;
          }
        }

        return {
          src: url,
          previewSrc: previewUrl,
          type: type,
          width: resource.width,
          height: resource.height,
          id: resource.public_id,
          alt: resource.filename || "Gallery Media",
          caption:
            resource.context?.caption ||
            resource.context?.custom?.caption ||
            "", // Try direct key first
        };
      });
    } catch (error) {
      console.error("Error fetching images from Cloudinary:", error);
      return [];
    }
  },
  ["gallery-images-cache"], // Cache key
  {
    revalidate: 3600, // Revalidate every 1 hour naturally
    tags: ["gallery"], // Tag for manual revalidation
  },
);
