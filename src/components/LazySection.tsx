"use client";
/** Reserve space before the section loads so the page doesn't jump. */

/**
 * Defers rendering of below-the-fold sections until they approach the
 * viewport. Renders a lightweight skeleton placeholder first, then mounts
 * the real content and plays its entrance reveal.
 */
// Play the section's own reveal now that it has mounted.

import { type ReactNode, useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  minHeight?: number;
  label?: string;
};
export function LazySection({ children, minHeight = 360, label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "480px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const node = host.current;
    if (!node) return;
    const frame = window.requestAnimationFrame(() => {
      node.querySelectorAll<HTMLElement>("[data-reveal]").forEach((item) => {
        item.classList.add("is-in");
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [visible]);

  if (!visible) {
    return (
      <div
        ref={host}
        className="lazy-section"
        style={{ minHeight }}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        <div className="lazy-skeleton" aria-hidden="true">
          <span className="lazy-skeleton-title" />
          <span className="lazy-skeleton-line" />
          <span className="lazy-skeleton-line is-short" />
        </div>
      </div>
    );
  }

  return (
    <div ref={host} className="lazy-section">
      {children}
    </div>
  );
}
