import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de forma eficiente, resolviendo conflictos de especificidad.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza y construye la URL completa de un recurso (usualmente imágenes).
 * Maneja rutas relativas, absolutas y pre-prefijadas.
 */
export const getFullImageUrl = (url?: string | null): string => {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl) return '';

  // Si ya es una URL externa, la devolvemos intacta
  if (/^https?:\/\//i.test(normalizedUrl)) return normalizedUrl;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
  const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, ''); // Elimina el sufijo /api/v1 limpiamente

  // Limpiamos la ruta recibida quitando barras iniciales
  const path = normalizedUrl.replace(/^\/+/, '');

  // Patrones conocidos
  if (path.startsWith('api/uploads/')) {
    return `${baseUrl}/${path}`;
  }

  if (path.startsWith('uploads/')) {
    return `${baseUrl}/api/${path}`;
  }

  // Por defecto, asumimos que es un nombre de archivo o ruta dentro de uploads
  return `${baseUrl}/api/uploads/${path}`;
};