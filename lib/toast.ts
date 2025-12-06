import { toast as sonner } from 'sonner';

export type ToastVariant = 'success' | 'info' | 'destructive';

export const toast = {
  success: (message: string, description?: string) =>
    sonner.success(message, description ? { description } : undefined),
  info: (message: string, description?: string) =>
    sonner.message(message, description ? { description } : undefined),
  destructive: (message: string, description?: string) =>
    sonner.error(message, description ? { description } : undefined),
};
