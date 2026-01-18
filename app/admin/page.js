"use client";

import { useState } from "react";
import { refreshGallery } from "../actions";

export default function AdminPage() {
    const [password, setPassword] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(false);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [caption, setCaption] = useState("");
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    // Clean up preview URL when file changes
    const handleFileSelect = (selectedFile) => {
        if (selectedFile) {
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
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
            // 1. Get Signature from Server
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

            // 2. Upload directly to Cloudinary
            const formData = new FormData();
            formData.append("file", file);
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
                                <p className="text-white/40 text-xs mt-2">Supports JPG, PNG, WEBP</p>
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
                    disabled={uploading || !file}
                    className={`mt-4 px-6 py-4 font-bold rounded tracking-widest uppercase transition-all
                        ${uploading || !file ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-white text-black hover:bg-gray-200 active:scale-95"}
                    `}
                >
                    {uploading ? "Uploading..." : "Upload Photo"}
                </button>

                {message && (
                    <div className={`p-4 rounded border ${message.includes("Error") ? "bg-red-500/10 border-red-500/50 text-red-200" : "bg-green-500/10 border-green-500/50 text-green-200"}`}>
                        <p className="text-center text-sm">{message}</p>
                    </div>
                )}
            </form>
        </div>
    );
}
