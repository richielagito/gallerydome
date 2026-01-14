import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary (re-use config logic or import, but config is global once set usually.
// Safer to explicitly config here in case this route runs in a cold lambda)
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export async function POST(request) {
    try {
        const data = await request.formData();
        const password = data.get("password");
        const file = data.get("file");
        const caption = data.get("caption");

        // 1. Verify Authentication
        if (!process.env.ADMIN_PASSWORD) {
            console.error("ADMIN_PASSWORD is not set in environment variables.");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        if (password !== process.env.ADMIN_PASSWORD) {
            console.warn(`Upload attempt failed: Incorrect password. Received '${password}', expected set password.`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!file || typeof file === "string") {
            // basic check
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 2. Convert file to buffer for upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 3. Upload to Cloudinary with Metadata (Context)
        // We use a Promise wrapper to handle the stream upload
        const result = await new Promise((resolve, reject) => {
            const uploadOptions = {
                folder: "gallery-dome",
                resource_type: "image", // Ensure strictly image
            };

            // Only add context if caption is provided
            if (caption && caption.trim().length > 0) {
                uploadOptions.context = `caption=${caption}`;
            }

            const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
            uploadStream.end(buffer);
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
    }
}
