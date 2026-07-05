"use client";

import React, { useState, useRef } from "react";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import authApi from "../../../api/auth";
import { toast } from "../../../lib/notifications";
import { getFullImageUrl } from "./utils";
import { Button } from "./button";
import { Label } from "./label";
import { cn } from "./utils";

interface ImageUploadZoneProps {
  value?: string;
  onChange: (url: string) => void;
  module: string;
  className?: string;
  label?: string;
  description?: string;
  ctaText?: string;
}

export function ImageUploadZone({
  value,
  onChange,
  module,
  className = "",
  label = "Imagen",
  description = "Sube una imagen o arrástrala desde tu equipo o internet",
  ctaText = "Subir imagen",
}: ImageUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUploadedUrl = (data: { fileUrl?: string; url?: string }) =>
    data.fileUrl || data.url || "";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const response = await authApi.post(`/uploads?module=${module}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      onChange(getUploadedUrl(response.data));
      toast.success("Imagen subida con éxito");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFromUrl = async (url: string) => {
    setIsUploading(true);
    try {
      const response = await authApi.post(
        `/uploads/url?module=${module}&url=${encodeURIComponent(url)}`
      );
      onChange(getUploadedUrl(response.data));
      toast.success("Imagen importada con éxito");
    } catch (err) {
      console.error(err);
      toast.error("Error al importar la imagen desde internet");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    // 1. Archivos locales caídos
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        await uploadFile(file);
      } else {
        toast.error("El archivo debe ser una imagen");
      }
      return;
    }

    // 2. URL arrastrada (desde otra web o texto plano)
    const url =
      e.dataTransfer.getData("text/uri-list") ||
      e.dataTransfer.getData("text/plain");
    if (url && url.startsWith("http")) {
      await uploadFromUrl(url);
      return;
    }

    // 3. HTML arrastrado (un nodo <img> directo desde otra pestaña)
    const html = e.dataTransfer.getData("text/html");
    if (html) {
      const match = html.match(/src="([^"]+)"/);
      if (match && match[1] && match[1].startsWith("http")) {
        await uploadFromUrl(match[1]);
        return;
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          await uploadFile(file);
          break;
        }
      }
    }
  };

  const removeImage = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && <Label>{label}</Label>}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onClick={() => !value && !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-all duration-200 select-none",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          value ? "border-border bg-card" : "cursor-pointer hover:bg-accent/40 border-muted-foreground/25",
          isDragging && "border-primary bg-primary/5 scale-[0.99]",
          isUploading && "opacity-80 pointer-events-none"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="text-xs font-medium text-muted-foreground">
              Procesando imagen...
            </p>
          </div>
        ) : value ? (
          <div className="group relative flex w-full items-center justify-center py-1">
            <div className="relative max-h-[160px] max-w-full overflow-hidden rounded-lg border border-border shadow-xs bg-background">
              <img
                src={getFullImageUrl(value)}
                alt="Vista previa"
                className="h-auto max-h-[150px] object-contain rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  className="h-8 gap-1.5 shadow-sm"
                >
                  <Trash2 className="size-4" />
                  Eliminar imagen
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            <div className="rounded-full border bg-background p-2.5 shadow-xs transition-transform duration-200 group-hover:scale-105">
              <UploadCloud className="size-5 text-muted-foreground/80" />
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-semibold text-primary tracking-tight">
                {ctaText}
              </p>
              {description && (
                <p className="mx-auto max-w-[280px] text-xs text-muted-foreground/90 leading-normal">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}