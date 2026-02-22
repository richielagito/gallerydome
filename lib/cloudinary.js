import { v2 as cloudinary } from "cloudinary";
import { unstable_cache } from "next/cache";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export const getGalleryImages = unstable_cache(
    async () => {
        try {
            const result = await cloudinary.search
                .expression("folder:gallery-dome AND (resource_type:image OR resource_type:video)")
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

                let animatedPreviewUrl = "";

                if (type === "video") {
                    const parts = url.split("/upload/");
                    // HD video: limit to 30 seconds, auto format/quality, capped width
                    url = `${parts[0]}/upload/f_auto,q_auto,w_1200,c_limit,du_30/${parts[1]}`;
                    const versionAndPath = parts[1];
                    const basePath = versionAndPath.replace(/\.[^/.]+$/, "");
                    // Static poster: first frame as optimized image (~10-30KB) — fast initial load
                    previewUrl = `${parts[0]}/upload/so_0,f_auto,q_auto,w_400,c_limit/${basePath}.jpg`;
                    // Animated preview: 3-second silent video at 200px/15fps (~30-80KB) — lazy loaded when facing camera
                    animatedPreviewUrl = `${parts[0]}/upload/f_mp4,q_auto:low,w_200,c_limit,du_3,fps_15,ac_none/${parts[1]}`;
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
                    animatedPreviewSrc: animatedPreviewUrl,
                    type: type,
                    width: resource.width,
                    height: resource.height,
                    id: resource.public_id,
                    alt: resource.filename || "Gallery Media",
                    caption: resource.context?.caption || resource.context?.custom?.caption || "", // Try direct key first
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
