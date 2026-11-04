"use client"

/** Read the current theme anywhere in the client tree (provided by Shell). */

import { createContext, useContext } from "react"

export type Theme = "dark" | "light"

type ThemeValue = {
  theme: Theme
  toggle: () => void
}

export const ThemeContext = createContext<ThemeValue>({
  theme: "dark",
  toggle: () => {},
})
export function useThemeContext(): ThemeValue {
  return useContext(ThemeContext)
}
