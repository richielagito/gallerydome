"use client";

import { useState } from "react";

export default function AdminPage() {
    const [password, setPassword] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(false);
    const [file, setFile] = useState(null);
    const [caption, setCaption] = useState("");
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

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

        const formData = new FormData();
        formData.append("file", file);
        formData.append("caption", caption);
        formData.append("password", password); // Send password for verification

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Upload successful!");
                setFile(null);
                setCaption("");
                // Reset file input manually if needed
                document.getElementById("fileInput").value = "";
            } else {
                setMessage(`Error: ${data.error}`);
            }
        } catch (error) {
            setMessage("Upload failed due to network error.");
        } finally {
            setUploading(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white font-spartan">
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
        <div className="min-h-screen p-8 bg-black text-white font-spartan flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

            <form onSubmit={handleUpload} className="w-full max-w-md flex flex-col gap-6 p-8 border border-white/20 rounded-xl backdrop-blur-md bg-white/5">
                <div className="flex flex-col gap-2">
                    <label htmlFor="fileInput" className="text-sm uppercase tracking-widest text-white/70">
                        Photo
                    </label>
                    <input
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm uppercase tracking-widest text-white/70">Caption</label>
                    <textarea
                        rows="3"
                        placeholder="Enter a caption for this photo..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded focus:outline-none focus:border-white/50 resize-none"
                    />
                </div>

                <button type="submit" disabled={uploading} className="mt-4 px-6 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {uploading ? "Uploading..." : "Upload Photo"}
                </button>

                {message && <p className={`text-center text-sm ${message.includes("Error") ? "text-red-400" : "text-green-400"}`}>{message}</p>}
            </form>
        </div>
    );
}
