"use client";

import { useState } from "react";
import { refreshGallery } from "../actions";

// Maximum file size before compression (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;
// Maximum dimension for compressed images
const MAX_DIMENSION = 2048;
// JPEG quality for compression (0.0 - 1.0)
const COMPRESSION_QUALITY = 0.85;

/**
 * Check if a file is HEIC/HEIF format
 * @param {File} file - The file to check
 * @returns {boolean}
 */
const isHeicFile = (file) => {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    return fileName.endsWith(".heic") || fileName.endsWith(".heif") || mimeType === "image/heic" || mimeType === "image/heif";
};

/**
 * Convert HEIC/HEIF file to JPEG using heic2any library
 * @param {File} file - The HEIC file to convert
 * @returns {Promise<File>} - The converted JPEG file
 */
const convertHeicToJpeg = async (file) => {
    // Dynamic import to avoid SSR issues
    const heic2any = (await import("heic2any")).default;

    const blob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.92, // Higher quality for initial conversion, we'll compress after
    });

    // heic2any can return an array of blobs for multi-image HEIC, get the first one
    const resultBlob = Array.isArray(blob) ? blob[0] : blob;

    // Create a new File from the blob with .jpg extension
    const newFileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    return new File([resultBlob], newFileName, {
        type: "image/jpeg",
        lastModified: Date.now(),
    });
};

/**
 * Compress an image file using Canvas API
 * Handles HEIC files by converting them first
 * @param {File} file - The image file to compress
 * @param {Function} onStatusUpdate - Optional callback for status updates
 * @returns {Promise<{file: File, originalSize: number, compressedSize: number, wasCompressed: boolean, wasConverted: boolean}>}
 */
const compressImage = async (file, onStatusUpdate) => {
    const originalSize = file.size;
    let fileToProcess = file;
    let wasConverted = false;

    // Convert HEIC to JPEG first if needed
    if (isHeicFile(file)) {
        if (onStatusUpdate) onStatusUpdate("Converting HEIC to JPEG...");
        try {
            fileToProcess = await convertHeicToJpeg(file);
            wasConverted = true;
        } catch (error) {
            console.error("HEIC conversion failed:", error);
            throw new Error("Failed to convert HEIC image. Please try converting it manually or use a different format.");
        }
    }

    // Skip compression for small files (after potential HEIC conversion)
    if (fileToProcess.size <= MAX_FILE_SIZE && !wasConverted) {
        return {
            file: fileToProcess,
            originalSize,
            compressedSize: fileToProcess.size,
            wasCompressed: false,
            wasConverted,
        };
    }

    if (onStatusUpdate) onStatusUpdate("Compressing image...");

    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error("Failed to read file"));

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;

            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = Math.round((height * MAX_DIMENSION) / width);
                    width = MAX_DIMENSION;
                } else {
                    width = Math.round((width * MAX_DIMENSION) / height);
                    height = MAX_DIMENSION;
                }
            }

            // Create canvas and draw resized image
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Failed to compress image"));
                        return;
                    }

                    // Create a new file from the blob
                    const compressedFile = new File([blob], fileToProcess.name.replace(/\.[^.]+$/, ".jpg"), {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    });

                    resolve({
                        file: compressedFile,
                        originalSize,
                        compressedSize: compressedFile.size,
                        wasCompressed: true,
                        wasConverted,
                    });
                },
                "image/jpeg",
                COMPRESSION_QUALITY,
            );
        };

        img.onerror = () => reject(new Error("Failed to load image"));

        reader.readAsDataURL(fileToProcess);
    });
};

/**
 * Format file size in human readable format
 */
const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

export default function AdminPage() {
    const [password, setPassword] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(false);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [caption, setCaption] = useState("");
    const [uploading, setUploading] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [compressionInfo, setCompressionInfo] = useState(null);
    const [message, setMessage] = useState("");

    // Clean up preview URL when file changes
    const handleFileSelect = (selectedFile) => {
        if (selectedFile) {
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
            // Reset compression info when a new file is selected
            setCompressionInfo(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreviewUrl(null);
        setCompressionInfo(null);
        const fileInput = document.getElementById("fileInput");
        if (fileInput) fileInput.value = "";
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setCheckingAuth(true);

        try {
            const res = await fetch("/api/check-auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                setIsLoggedIn(true);
            } else {
                alert("Incorrect Password");
            }
        } catch (err) {
            alert("Login failed due to network error");
        } finally {
            setCheckingAuth(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setMessage("Please select a file.");
            return;
        }

        setUploading(true);
        setMessage("");

        try {
            // 1. Compress image if needed (also converts HEIC)
            setCompressing(true);
            setMessage("Processing image...");

            let fileToUpload = file;
            try {
                const result = await compressImage(file, (status) => setMessage(status));
                fileToUpload = result.file;
                setCompressionInfo(result);

                if (result.wasConverted || result.wasCompressed) {
                    const savedPercent = Math.round((1 - result.compressedSize / result.originalSize) * 100);
                    let statusMsg = "";
                    if (result.wasConverted && result.wasCompressed) {
                        statusMsg = `Converted HEIC & compressed: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${savedPercent}% saved)`;
                    } else if (result.wasConverted) {
                        statusMsg = `Converted HEIC: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}`;
                    } else {
                        statusMsg = `Compressed: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${savedPercent}% saved)`;
                    }
                    setMessage(statusMsg);
                }
            } catch (compressError) {
                console.error("Image processing failed:", compressError);
                setMessage(`Error: ${compressError.message}`);
                setUploading(false);
                setCompressing(false);
                return;
            }
            setCompressing(false);

            // 2. Get Signature from Server
            setMessage("Preparing upload...");
            const signRes = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password, caption }),
            });

            const signData = await signRes.json();

            if (!signRes.ok) {
                throw new Error(signData.error || "Failed to get upload signature");
            }

            const { signature, timestamp, api_key, cloud_name, folder, context } = signData;

            // 3. Upload compressed file directly to Cloudinary
            setMessage("Uploading...");
            const formData = new FormData();
            formData.append("file", fileToUpload);
            formData.append("api_key", api_key);
            formData.append("timestamp", timestamp);
            formData.append("signature", signature);
            formData.append("folder", folder);

            if (context) {
                formData.append("context", context);
            }

            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
                method: "POST",
                body: formData,
            });

            const uploadData = await uploadRes.json();

            if (uploadRes.ok) {
                // 3. Success & Refresh
                setMessage("Upload successful!");
                clearFile();
                setCaption("");

                // Refresh the gallery cache on server
                await refreshGallery();
            } else {
                setMessage(`Upload Error: ${uploadData.error?.message || "Unknown error"}`);
            }
        } catch (error) {
            console.error(error);
            setMessage(error.message || "Upload failed due to network error.");
        } finally {
            setUploading(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white font-spartan overflow-y-scroll">
                <form onSubmit={handleLogin} className="flex flex-col gap-4 p-8 border border-white/20 rounded-xl backdrop-blur-md">
                    <h1 className="text-2xl font-bold text-center mb-4">Admin Login</h1>
                    <input
                        type="password"
                        placeholder="Enter Admin Password"
                        className="px-4 py-2 bg-white/10 border border-white/20 rounded text-center focus:outline-none focus:border-white/50"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" disabled={checkingAuth} className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-gray-200 transition disabled:opacity-50">
                        {checkingAuth ? "Checking..." : "Access Dashboard"}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full overflow-y-auto p-4 md:p-8 bg-black text-white font-spartan flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

            <form onSubmit={handleUpload} className="w-full max-w-lg flex flex-col gap-6 p-8 border border-white/20 rounded-xl backdrop-blur-md bg-white/5 shadow-2xl">
                <div className="flex flex-col gap-2">
                    <label className="text-sm uppercase tracking-widest text-white/70 mb-1">Photo Upload</label>

                    {!file ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                                relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer group
                                ${isDragging ? "border-white bg-white/10" : "border-white/20 hover:border-white/50 hover:bg-white/5"}
                            `}
                        >
                            <input id="fileInput" type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <div className="pointer-events-none flex flex-col items-center text-center p-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/50 mb-4 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <p className="text-white/80 font-medium">Drag & Drop or Click to Upload</p>
                                <p className="text-white/40 text-xs mt-2">Supports JPG, PNG, WEBP, HEIC (iPhone)</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full rounded-xl overflow-hidden group border border-white/20">
                            {/* Preview */}
                            {previewUrl && <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-[400px] object-contain bg-black/50" />}

                            {/* Desktop Overlay (Hover) */}
                            <div className="hidden md:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
                                <button type="button" onClick={clearFile} className="px-4 py-2 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Remove Photo
                                </button>
                            </div>

                            {/* Mobile Remove Button (Always Visible) */}
                            <button type="button" onClick={clearFile} className="md:hidden absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>

                            {/* File Size Info */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                <p className="text-white/70 text-xs">
                                    {isHeicFile(file) ? (
                                        <span className="flex items-center gap-1 flex-wrap">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span className="text-purple-400">{formatFileSize(file.size)} (HEIC)</span>
                                            <span className="text-white/50">• Will be converted to JPEG{file.size > MAX_FILE_SIZE ? " & compressed" : ""}</span>
                                        </span>
                                    ) : file.size > MAX_FILE_SIZE ? (
                                        <span className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-yellow-400">{formatFileSize(file.size)}</span>
                                            <span className="text-white/50">• Will be compressed before upload</span>
                                        </span>
                                    ) : (
                                        <span className="text-green-400">{formatFileSize(file.size)} ✓</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm uppercase tracking-widest text-white/70">Caption</label>
                    <textarea
                        rows="3"
                        placeholder="Enter a caption for this photo..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded focus:outline-none focus:border-white/50 resize-none transition-colors"
                    />
                </div>

                <button
                    type="submit"
                    disabled={uploading || compressing || !file}
                    className={`mt-4 px-6 py-4 font-bold rounded tracking-widest uppercase transition-all
                        ${uploading || compressing || !file ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-white text-black hover:bg-gray-200 active:scale-95"}
                    `}
                >
                    {compressing ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Compressing...
                        </span>
                    ) : uploading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                        </span>
                    ) : (
                        "Upload Photo"
                    )}
                </button>

                {message && (
                    <div
                        className={`p-4 rounded border ${
                            message.includes("Error")
                                ? "bg-red-500/10 border-red-500/50 text-red-200"
                                : message.includes("Compress") || message.includes("Uploading") || message.includes("Preparing")
                                  ? "bg-blue-500/10 border-blue-500/50 text-blue-200"
                                  : "bg-green-500/10 border-green-500/50 text-green-200"
                        }`}
                    >
                        <p className="text-center text-sm">{message}</p>
                    </div>
                )}
            </form>
        </div>
    );
}
