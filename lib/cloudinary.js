import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export async function getGalleryImages() {
    try {
        const result = await cloudinary.search
            .expression("folder:gallery-dome AND resource_type:image")
            .with_field("context")
            .sort_by("created_at", "desc")
            .max_results(30) // Adjust max results as needed
            .execute();

        if (!result || !result.resources) {
            return [];
        }

        return result.resources.map((resource, i) => {
            let url = resource.secure_url;

            // Optimization: Apply q_auto, f_auto, and limit width to prevent massive downloads (timeouts)
            if (url.includes("/upload/") && !url.includes("q_auto")) {
                const parts = url.split("/upload/");
                url = `${parts[0]}/upload/q_auto,f_auto,w_1200,c_limit/${parts[1]}`;
            }

            // Compatibility: Force HEIC extension to JPG to avoid browser issues
            if (url.toLowerCase().endsWith(".heic")) {
                url = url.replace(/\.heic$/i, ".jpg");
            }

            return {
                src: url,
                width: resource.width,
                height: resource.height,
                id: resource.public_id,
                alt: resource.filename || "Gallery Image",
                caption: resource.context?.caption || resource.context?.custom?.caption || "", // Try direct key first
            };
        });
    } catch (error) {
        console.error("Error fetching images from Cloudinary:", error);
        return [];
    }
}
