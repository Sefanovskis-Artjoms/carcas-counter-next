"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

// MARK: Constants

const NAV_STACK_KEY = "app-nav-stack";

type Router = ReturnType<typeof useRouter>;

// MARK: Session storage helpers

function getStack(): string[] {
  try {
    const raw = sessionStorage.getItem(NAV_STACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStack(stack: string[]) {
  sessionStorage.setItem(NAV_STACK_KEY, JSON.stringify(stack));
}

function syncStackToCurrentPath(currentPath: string) {
  const stack = getStack();
  const idx = stack.lastIndexOf(currentPath);

  if (idx >= 0) {
    setStack(stack.slice(0, idx + 1));
    return;
  }

  setStack([currentPath]);
}

function navigateBack(router: Router, fallback = "/"): void {
  const stack = getStack();

  if (stack.length > 1) {
    const newStack = stack.slice(0, -1);
    setStack(newStack);
    router.push(newStack[newStack.length - 1]);
    return;
  }

  setStack([fallback]);
  router.push(fallback);
}

// MARK: Hooks

export function useAppBack(fallback = "/") {
  const router = useRouter();
  return () => navigateBack(router, fallback);
}

// MARK: Tracker component

export default function InternalNavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  const currentPath = useMemo(() => {
    const search = searchParams.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    const onPopState = () => {
      const path =
        window.location.pathname +
        (window.location.search ? window.location.search : "");
      syncStackToCurrentPath(path);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      syncStackToCurrentPath(currentPath);
      return;
    }

    const stack = getStack();
    const lastEntry = stack[stack.length - 1];
    const lastPathname = lastEntry?.split("?")[0] ?? "";

    if (lastPathname === pathname) {
      setStack([...stack.slice(0, -1), currentPath]);
      return;
    }

    if (stack[stack.length - 1] !== currentPath) {
      setStack([...stack, currentPath]);
    }
  }, [currentPath, pathname]);

  return null;
}
