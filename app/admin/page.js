"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { refreshGallery, updateAssetContext } from "../actions";
import { Toaster, toast } from "sonner";
import { Upload, CheckCircle2, Save, X, Loader2 } from "lucide-react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Flow states
  const [uploadedAsset, setUploadedAsset] = useState(null);
  const [caption, setCaption] = useState("");
  const [isSavingContext, setIsSavingContext] = useState(false);

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

  const onUploadSuccess = (result) => {
    // result.info contains the data of the uploaded asset
    const { public_id, resource_type, secure_url } = result.info;

    // Save the uploaded asset details to show the second step (caption input)
    setUploadedAsset({
      publicId: public_id,
      resourceType: resource_type,
      url: secure_url,
    });

    toast.success("File berhasil di-upload! Silakan tambahkan caption.");
  };

  const handleSavePost = async () => {
    if (!uploadedAsset) return;

    setIsSavingContext(true);
    const toastId = toast.loading("Menyimpan postingan...");

    try {
      // Call server action to attach the caption via Cloudinary SDK
      await updateAssetContext({
        publicId: uploadedAsset.publicId,
        resourceType: uploadedAsset.resourceType,
        caption,
        password,
      });

      // Refresh the server-side cache so the DomeGallery fetches the new media
      await refreshGallery();

      toast.success("Postingan berhasil disimpan!", { id: toastId });

      // Reset flow
      setCaption("");
      setUploadedAsset(null);
    } catch (err) {
      toast.error(`Gagal menyimpan caption: ${err.message}`, { id: toastId });
    } finally {
      setIsSavingContext(false);
    }
  };

  const handleCancel = () => {
    // Technically the file is already in Cloudinary.
    // We just reset the local state, effectively discarding the caption step.
    if (
      confirm(
        "Yakin ingin membatalkan? File sudah terupload ke server tetapi tanpa caption.",
      )
    ) {
      setUploadedAsset(null);
      setCaption("");
      toast.info("Diupload tanpa caption.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-spartan overflow-y-scroll">
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4 p-6 border border-white/20 rounded-xl backdrop-blur-md"
        >
          <h1 className="text-2xl font-bold text-center mb-4">Admin Login</h1>
          <input
            type="password"
            placeholder="Enter Admin Password"
            className="px-4 py-2 bg-white/10 border border-white/20 rounded text-center focus:outline-none focus:border-white/50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={checkingAuth}
            className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-gray-200 transition disabled:opacity-50"
          >
            {checkingAuth ? "Checking..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" theme="dark" richColors />
      <div className="h-[100dvh] w-full overflow-y-auto p-4 md:p-8 bg-black text-white font-spartan flex flex-col items-center">
        <h1 className="text-4xl font-bold mt-4 mb-8">Admin Dashboard</h1>

        <div className="w-full max-w-lg flex flex-col gap-6 p-6 border border-white/20 rounded-xl backdrop-blur-md bg-white/5 shadow-2xl">
          {/* Step 1: Upload Widget */}
          {!uploadedAsset && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold mb-2">Upload File Baru</h2>
                <p className="text-sm text-white/50">
                  Pilih foto atau video dari perangkat Anda untuk diunggah.
                </p>
              </div>

              <CldUploadWidget
                signatureEndpoint="/api/upload"
                onSuccess={onUploadSuccess}
                options={{
                  folder: "gallery-dome",
                  clientAllowedFormats: ["image", "video"],
                  maxVideoFileSize: 50000000, // 50MB
                  sources: ["local", "url", "camera"],
                  multiple: false,
                  cropping: true,
                  showSkipCropButton: false, // Forces the user to crop/trim (video UI - Note: as discussed this only crops images natively)
                  croppingAspectRatio: 1,
                  maxVideoDuration: 30, // UI cue
                }}
              >
                {({ open }) => {
                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        open();
                      }}
                      className="px-8 py-4 bg-white text-black font-bold rounded-lg tracking-widest uppercase hover:bg-gray-200 transition-all inline-flex items-center justify-center gap-3 active:scale-95 leading-none"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="translate-y-[2px]">Pilih File</span>
                    </button>
                  );
                }}
              </CldUploadWidget>
            </div>
          )}

          {/* Step 2: Post-upload Preview & Caption */}
          {uploadedAsset && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-500">
              <div className="w-full rounded-md overflow-hidden bg-black/50 border border-white/20 flex flex-col items-center justify-center relative min-h-[200px]">
                {uploadedAsset.resourceType === "video" ? (
                  <video
                    src={uploadedAsset.url}
                    controls
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                ) : (
                  <img
                    src={uploadedAsset.url}
                    alt="Uploaded preview"
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                )}
                {/* Full-width gradient vignette on top */}
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute top-1 right-0 text-white text-xs px-2 py-1 inline-flex items-center justify-center gap-1.5 font-semibold z-10 transition-all leading-none">
                  <span className="translate-y-[2px]">Uploaded</span>{" "}
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm uppercase tracking-widest text-white/70">
                  Caption Postingan
                </label>
                <textarea
                  rows="3"
                  placeholder="Tulis deskripsi atau caption menarik..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded focus:outline-none focus:border-white/50 resize-none transition-colors"
                  disabled={isSavingContext}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSavingContext}
                  className="flex-1 px-4 py-3 bg-white/10 text-white font-bold rounded hover:bg-white/20 transition-all uppercase tracking-wider text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 leading-none"
                >
                  <X className="w-4 h-4" />{" "}
                  <span className="translate-y-[2px]">Batal</span>
                </button>
                <button
                  type="button"
                  onClick={handleSavePost}
                  disabled={isSavingContext}
                  className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 transition-all uppercase tracking-wider disabled:opacity-50 inline-flex items-center justify-center gap-2 leading-none"
                >
                  {isSavingContext ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      <span className="translate-y-[2px]">Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span className="translate-y-[2px]">
                        Simpan Postingan
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
