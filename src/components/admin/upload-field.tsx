"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { isInlineImage } from "@/lib/image-reference";

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
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]">
            <UploadCloud size={16} />
            <span>{uploading ? "Enviando..." : "Selecionar imagem"}</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <span className="text-xs leading-5 text-[var(--muted)]">
            PNG, JPG, WEBP ou SVG com ate 4 MB.
          </span>
        </div>
        <p className="text-xs leading-5 text-[var(--muted)]">
          Para bases com muitos produtos e banners, prefira colar uma URL externa da imagem.
        </p>
        {value ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-strong)]">
              <CheckCircle2 size={14} />
              Imagem pronta para salvar
            </div>
            <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
              <Image
                src={value}
                alt={label}
                width={640}
                height={320}
                unoptimized={isInlineImage(value)}
                className="h-40 w-full object-cover"
              />
            </div>
          </div>
        ) : null}
        {error ? (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
