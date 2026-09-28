import { useEffect, useRef } from "react";

export function clearBodyScrollLock() {
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
}

/**
 * Locks body scroll while `locked` is true (e.g. cart drawer, mobile menu).
 * Restores scroll only when unlocking on the same page — not on unmount.
 */
export function useBodyScrollLock(locked: boolean) {
  const scrollYRef = useRef(0);
  const wasLockedRef = useRef(false);

  useEffect(() => {
    if (locked) {
      scrollYRef.current = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      wasLockedRef.current = true;

      return () => {
        clearBodyScrollLock();
        wasLockedRef.current = false;
      };
    }

    if (wasLockedRef.current) {
      clearBodyScrollLock();
      window.scrollTo(0, scrollYRef.current);
      wasLockedRef.current = false;
    }
  }, [locked]);
}
