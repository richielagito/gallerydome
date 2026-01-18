import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { password, caption } = body;

        // 1. Verify Authentication
        if (!process.env.ADMIN_PASSWORD) {
            console.error("ADMIN_PASSWORD is not set in environment variables.");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Prepare Parameters for Signature
        const timestamp = Math.round(new Date().getTime() / 1000);
        const paramsToSign = {
            timestamp: timestamp,
            folder: "gallery-dome",
        };

        // Only add context if caption is provided
        if (caption && caption.trim().length > 0) {
            paramsToSign.context = `caption=${caption}`;
        }

        // 3. Generate Signature
        const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

        // 4. Return necessary data to client
        return NextResponse.json({
            signature,
            timestamp,
            api_key: process.env.CLOUDINARY_API_KEY,
            cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            folder: paramsToSign.folder,
            context: paramsToSign.context || null,
        });
    } catch (error) {
        console.error("Signature generation error:", error);
        return NextResponse.json({ error: "Signature generation failed: " + error.message }, { status: 500 });
    }
}
