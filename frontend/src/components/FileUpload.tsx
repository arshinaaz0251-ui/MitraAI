"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  X,
} from "lucide-react";
import type { Language } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

interface FileUploadProps {
  language?: Language;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const downscaleImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const MAX_SIZE = 1200;
      let width = img.width;
      let height = img.height;
      
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(file);
      }
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const downscaledFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(downscaledFile);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
};

export default function FileUpload({
  onFileSelect,
  selectedFile,
  onClear,
}: FileUploadProps) {
  const { t } = useLanguage();
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        const processedFile = await downscaleImage(file);
        onFileSelect(processedFile);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const processedFile = await downscaleImage(file);
        onFileSelect(processedFile);
      }
    },
    [onFileSelect]
  );

  return (
    <div className="w-full">
      {selectedFile ? (
        /* File selected card */
        <div className="p-5 md:p-6 rounded-2xl bg-[#E6F4EA] border border-[#15803D]/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white text-[#15803D] border border-[#15803D]/20 flex items-center justify-center flex-shrink-0 shadow-xs">
              <CheckCircle2 size={22} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#1B2430] text-base truncate">
                {selectedFile.name}
              </p>
              <p className="text-sm text-[#15803D] font-medium mt-0.5">
                {t("readyToCheckCriteria", {
                  size: (selectedFile.size / 1024).toFixed(1),
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="p-2.5 rounded-xl bg-white hover:bg-[#F0EEE8] text-[#4B5563] hover:text-[#1B2430] border border-[#E2DED5] transition-colors cursor-pointer flex-shrink-0"
            aria-label={t("removeDocument")}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        /* Generous Dashed Upload Zone */
        <div
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
            isDragActive
              ? "border-[#0F4C5C] bg-[#E3F0F2]"
              : "border-[#E2DED5] hover:border-[#0F4C5C] bg-[#F7F5F0] hover:bg-[#F0EEE8]"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label={t("uploadDocument")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="flex flex-col items-center gap-3 max-w-md">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2DED5] text-[#0F4C5C] flex items-center justify-center shadow-xs">
              <Upload size={26} />
            </div>

            {/* Title & Helper Text */}
            <div>
              <p className="font-bold text-lg text-[#1B2430] tracking-tight">
                {t("uploadDocument")}
              </p>
              <p className="text-sm text-[#4B5563] mt-1 leading-relaxed">
                {t("uploadHint")}
              </p>
            </div>

            {/* Two Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="civora-btn-primary h-12 px-5 text-sm"
              >
                <FileText size={18} />
                <span>{t("uploadButton")}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="civora-btn-secondary h-12 px-5 text-sm"
              >
                <Camera size={18} />
                <span>{t("takePhoto")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
