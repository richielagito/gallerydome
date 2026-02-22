"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export async function refreshGallery() {
    revalidatePath("/");
    revalidateTag("gallery"); // Flush the unstable_cache in getGalleryImages
}

export async function updateAssetContext({ publicId, resourceType, caption, password }) {
    if (password !== process.env.ADMIN_PASSWORD) {
        throw new Error("Unauthorized");
    }

    if (!caption || caption.trim() === "") {
        return { success: true };
    }

    try {
        await cloudinary.api.update(publicId, {
            resource_type: resourceType,
            context: `caption=${caption.trim()}`,
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to update context:", error);
        throw new Error("Failed to save caption: " + (error.message || "Unknown error"));
    }
}
