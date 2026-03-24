"use client";

import { useRef, useState } from "react";

type UploadFieldProps = {
  label: string;
  scope: "branding" | "products" | "banners";
  value: string;
  onChange: (value: string) => void;
};

export function UploadField({ label, scope, value, onChange }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("scope", scope);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Nao foi possivel enviar a imagem.");
        return;
      }

      onChange(data.url);
    } catch {
      setError("Falha ao enviar a imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-white p-4">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm"
          placeholder="Cole uma URL ou envie uma imagem"
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="text-sm"
          />
          {uploading ? (
            <span className="text-sm text-[var(--muted)]">Enviando...</span>
          ) : null}
        </div>
        {error ? (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
