"use client";

import { API_BASE_URL } from "@/src/service/api-base-url";
import { Auth } from "@/src/service/auth.service";

export { API_BASE_URL };

type UploadResponse = {
  path: string;
  url: string;
  filename: string;
  content_type?: string | null;
};

function getAuthHeaders() {
  const token = Auth.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail || data?.mensagem || "Nao foi possivel concluir a operacao.";
    throw new Error(message);
  }

  return data as T;
}

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

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    const data = await parseResponse<UploadResponse>(response);
    return {
      path: data.path,
      url: buildFileUrl(data.url),
    };
  },
};
