"use client";

import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function addToRemoveQueue(toastId: string, delay = TOAST_REMOVE_DELAY) {
  if (toastTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "DISMISS_TOAST", toastId });
  }, delay);
  toastTimeouts.set(toastId, timeout);
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        const existing = toastTimeouts.get(toastId);
        if (existing) {
          clearTimeout(existing);
          toastTimeouts.delete(toastId);
        }
        setTimeout(
          () => dispatch({ type: "REMOVE_TOAST", toastId }),
          100,
        );
      } else {
        state.toasts.forEach((t) => {
          const existing = toastTimeouts.get(t.id);
          if (existing) {
            clearTimeout(existing);
            toastTimeouts.delete(t.id);
          }
          setTimeout(
            () => dispatch({ type: "REMOVE_TOAST", toastId: t.id }),
            100,
          );
        });
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined ? { ...t, open: false } : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) return { ...state, toasts: [] };
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

type ToastInit = Omit<ToasterToast, "id"> & { duration?: number };

export function toast({ duration = TOAST_REMOVE_DELAY, ...props }: ToastInit) {
  const id = genId();
  const update = (next: ToasterToast) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...next, id } });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      duration,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });
  addToRemoveQueue(id, duration);
  return { id, dismiss, update };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);
  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}
