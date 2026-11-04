"use client";

/**
 * Adds `.is-in` to `[data-reveal]` blocks as they enter the viewport.
 * Mounted once in the Shell so every route — server or client rendered —
 * gets the reveal treatment without each page wiring its own observer.
 */

import { usePathname } from "next/navigation";
import { useEffect } from "react";
export function Reveal() {
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the intentional re-scan trigger after navigation.
  useEffect(() => {
    const scope = document.querySelector("main");
    if (!scope) return;
    const items = Array.from(
      scope.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach((item) => {
        item.classList.add("is-in");
      });
      return;
    }

    items.forEach((item) => {
      const siblings = Array.from(item.parentElement?.children ?? []).filter(
        (child) => child.hasAttribute("data-reveal"),
      );
      const order = Math.min(Math.max(siblings.indexOf(item), 0), 6);
      item.style.setProperty("--reveal-delay", `${order * 55}ms`);
      if (item.getBoundingClientRect().top < window.innerHeight * 0.94) {
        item.classList.add("is-in");
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
    );

    items
      .filter((item) => !item.classList.contains("is-in"))
      .forEach((item) => {
        observer.observe(item);
      });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
