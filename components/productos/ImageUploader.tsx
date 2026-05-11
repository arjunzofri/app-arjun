"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

export default function ImageUploader({
  productoId,
  onUploaded,
}: {
  productoId: string;
  onUploaded?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Solo se permiten imágenes");
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/productos/${productoId}/imagenes`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al subir imagen");
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleSelect}
          className="text-sm text-[#43474e] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#f0f3ff] file:text-[#0051d5] hover:file:bg-[#dbe1ff]"
        />
        {file && (
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={uploading}
              className="bg-[#16a34a] text-white hover:bg-[#15803d] text-xs"
            >
              {uploading ? "Subiendo..." : "Subir"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="border-[#c4c6cf] text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {preview && (
        <div className="relative w-40 h-40 rounded border border-[#e2e8f0] overflow-hidden bg-[#f9f9ff]">
          <img src={preview} alt="Preview" className="w-full h-full object-contain" />
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}
    </div>
  );
}
