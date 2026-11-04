"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cities, companies } from "../data/companies";
import { useBodyLock, useMediaQuery } from "../lib/hooks";
import { Brand } from "./Brand";
import { ArrowUpRight, ChevronRight, Close, Moon, Sun } from "./icons";

const links = [
  {
    page: "map",
    href: "/map",
    label: "The map",
    hint: "Every company, pinned by neighbourhood",
  },
  {
    page: "cities",
    href: "/cities",
    label: "Cities",
    hint: "Eight hubs, one national view",
  },
  {
    page: "companies",
    href: "/companies",
    label: "Companies",
    hint: "Browse the directory",
  },
  {
    page: "jobs",
    href: "/jobs",
    label: "Jobs",
    hint: "Open roles, straight from company boards",
  },
  {
    page: "about",
    href: "/about",
    label: "How it works",
    hint: "Three steps, no middlemen",
  },
  {
    page: "pricing",
    href: "/pricing",
    label: "Pricing",
    hint: "Free to explore, always",
  },
];

export function MobileNav({
  open,
  page,
  theme,
  onClose,
  onToggleTheme,
}: {
  open: boolean;
  page: string;
  theme: "dark" | "light";
  onClose: () => void;
  onToggleTheme: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const wide = useMediaQuery("(min-width: 901px)");
  useBodyLock(open);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const onNativeClose = () => closeRef.current();
    node.addEventListener("close", onNativeClose);
    return () => node.removeEventListener("close", onNativeClose);
  }, []);

  useEffect(() => {
    if (open && wide) closeRef.current();
  }, [open, wide]);

  const activePage = page === "jobs" ? "companies" : page;

  return (
    <dialog
      ref={dialog}
      className="nav-dialog"
      aria-label="Site navigation"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="nav-dialog-inner">
        <div className="nav-dialog-head">
          <Brand onNavigate={onClose} />
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <Close size={22} />
          </button>
        </div>

        <nav className="nav-dialog-links" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.page}
              href={link.href}
              className={activePage === link.page ? "is-active" : ""}
              aria-current={activePage === link.page ? "page" : undefined}
              onClick={onClose}
            >
              <span>
                <strong>{link.label}</strong>
                <small>{link.hint}</small>
              </span>
              <ChevronRight size={18} />
            </Link>
          ))}
        </nav>

        <section
          className="nav-dialog-cities"
          aria-labelledby="nav-cities-title"
        >
          <h2 id="nav-cities-title">Start with a city</h2>
          <div className="nav-city-grid">
            {cities.map((city) => (
              <Link
                key={city.id}
                href={`/map?city=${city.id}`}
                onClick={onClose}
              >
                <span>{city.name}</span>
                <small>
                  {
                    companies.filter((company) => company.city === city.id)
                      .length
                  }{" "}
                  companies
                </small>
              </Link>
            ))}
          </div>
        </section>

        <div className="nav-dialog-foot">
          <p>Opportunity, mapped. Verified company directory.</p>
          <div className="nav-dialog-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onToggleTheme}
              suppressHydrationWarning
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </button>
            <Link href="/companies" className="text-link" onClick={onClose}>
              Browse companies <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </dialog>
  );
}
