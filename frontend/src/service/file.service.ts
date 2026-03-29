"use client";

import { API_BASE_URL } from "@/src/service/api-base-url";
import { api } from "./api";

export { API_BASE_URL };

type UploadResponse = {
  path: string;
  url: string;
  filename: string;
  content_type?: string | null;
};

export function buildFileUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
}

export function extractFilePath(value?: string | null): string | null {
  if (!value) return null;

  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  if (normalizedValue.startsWith(`${API_BASE_URL}/files/`)) {
    return normalizedValue.slice(`${API_BASE_URL}/files/`.length);
  }

  const filesIndex = normalizedValue.indexOf("/files/");
  if (filesIndex >= 0) {
    return normalizedValue.slice(filesIndex + "/files/".length);
  }

  return normalizedValue;
}

export const FileService = {
  async upload(file: File, folder = "images"): Promise<{ path: string; url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const { data, ok, error } = await api.post<UploadResponse>("/files/upload", formData);

    if (!ok || !data) {
      throw new Error(error || "Falha ao realizar upload");
    }

    return {
      path: data.path,
      url: buildFileUrl(data.url),
    };
  },
};
