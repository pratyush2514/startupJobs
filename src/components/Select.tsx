"use client";

// A custom dropdown that looks and feels like the rest of the site. The
// native <select> renders its option list with the operating system's own
// chrome (including the blue highlight), which no CSS can restyle — so the
// map page's city and neighbourhood pickers use this instead. Keyboard:
// arrows move, Enter picks, Escape closes, Home/End jump.

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "@/components/icons";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
};

type SelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label: string;
  icon?: ReactNode;
  className?: string;
};

export function Select({
  value,
  options,
  onChange,
  label,
  icon,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      options.findIndex((option) => option.value === value),
    ),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const keyboardNav = useRef(false);
  const selected =
    options.find((option) => option.value === value) ?? options[0];

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Opening the menu focuses the selected option so arrow keys work at once.
  useEffect(() => {
    if (!open) return;
    setActive(
      Math.max(
        0,
        options.findIndex((option) => option.value === value),
      ),
    );
    keyboardNav.current = true;
  }, [open, options, value]);

  useEffect(() => {
    if (!open || !keyboardNav.current) return;
    optionRefs.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const onTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      keyboardNav.current = true;
      setActive((current) => Math.min(options.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      keyboardNav.current = true;
      setActive((current) => Math.max(0, current - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      keyboardNav.current = true;
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      keyboardNav.current = true;
      setActive(options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(options[active].value);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`custom-select${className ? ` ${className}` : ""}`}
    >
      <button
        type="button"
        ref={triggerRef}
        className={`select-trigger${open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => {
          keyboardNav.current = false;
          setOpen((current) => !current);
        }}
        onKeyDown={onTriggerKeyDown}
      >
        {icon}
        <span className="select-value">{selected?.label}</span>
        {selected?.hint && <span className="select-hint">{selected.hint}</span>}
        <ChevronDown size={14} className="select-chevron" />
      </button>
      {open && (
        <div
          className="select-menu"
          role="listbox"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              role="option"
              aria-selected={option.value === value}
              className={`select-option${
                option.value === value ? " is-selected" : ""
              }${index === active ? " is-active" : ""}`}
              onClick={() => choose(option.value)}
              onMouseEnter={() => {
                keyboardNav.current = false;
                setActive(index);
              }}
            >
              <span className="select-option-label">{option.label}</span>
              {option.hint && (
                <span className="select-option-hint">{option.hint}</span>
              )}
              {option.value === value && (
                <Check size={14} className="select-option-check" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
