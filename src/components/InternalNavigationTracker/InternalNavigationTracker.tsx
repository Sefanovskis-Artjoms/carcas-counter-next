"use client";

/**
 * Tracks an in-app navigation stack so "Back" buttons return to the previous
 * view *within this app*, not wherever the browser history happens to point.
 *
 * Why this exists: the app navigates with router.replace and URL query params
 * (e.g. /?batch=123, /history?page=2). Relying on the browser Back button alone
 * would either replay those intermediate query-string states or jump to an
 * external page. Keeping our own stack lets Back mean "the previous meaningful
 * screen" and fall back to "/" when there's nowhere left to go.
 *
 * It lives in sessionStorage (not React state) so the stack survives full page
 * reloads / Server Component navigations but is scoped to the browser tab.
 *
 * Usage:
 *  - Mount <InternalNavigationTracker /> exactly once (in the root layout). It
 *    renders nothing; it only observes route changes and keeps the stack in sync.
 *  - Call useAppBack() in any component that needs an in-app Back action.
 */

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

// Used on first load and on browser back/forward (popstate): align our stack
// with the path the browser actually landed on. If that path is already in the
// stack, truncate back to it (treat it as a "go back"); otherwise the user
// arrived fresh (deep link / new tab), so start a new stack from here.
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

    // Same page, only the query string changed (e.g. /?batch=1 -> /?batch=2, or
    // history filters/pagination). Replace the top entry instead of pushing, so
    // a single Back leaves the page rather than stepping through every filter state.
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
