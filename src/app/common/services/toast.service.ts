import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  message: string;
  tone: 'error' | 'success';
}

const TOAST_DURATION_MS = 4000;

/** Minimal app-wide toast/snackbar service, used mainly to surface optimistic-update rollbacks. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  readonly toasts = signal<ToastMessage[]>([]);

  /** Queues a toast message; it auto-dismisses itself after a few seconds. */
  show(message: string, tone: ToastMessage['tone'] = 'error'): void {
    const id = this.nextId++;
    this.toasts.update((current) => [...current, { id, message, tone }]);
    setTimeout(() => this.dismiss(id), TOAST_DURATION_MS);
  }

  /** Removes a toast by id (called automatically on timeout, or manually via its dismiss button). */
  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }
}
