import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

export type PageRoute = {
  page: string
  params: URLSearchParams
  hash: string
}

const subscribeToHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange)
  window.addEventListener("popstate", onChange)
  return () => {
    window.removeEventListener("hashchange", onChange)
    window.removeEventListener("popstate", onChange)
  }
}

const readHash = () => window.location.hash
const readServerHash = () => ""

export function useRoute(): PageRoute {
  const hash = useSyncExternalStore(subscribeToHash, readHash, readServerHash)
  const [path, query = ""] = hash.replace(/^#\/?/, "").split("?")
  return {
    page: (path || "home").replace(/\/$/, ""),
    params: new URLSearchParams(query),
    hash,
  }
}

type Theme = "dark" | "light"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  )

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.colorScheme = theme
    try {
      window.localStorage.setItem("sa-theme", theme)
    } catch {
      /* storage can be unavailable */
    }
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta) meta.content = theme === "dark" ? "#0c0e0c" : "#f7f7f2"
  }, [theme])

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: light)")
    const onChange = (event: MediaQueryListEvent) => {
      try {
        if (!window.localStorage.getItem("sa-theme")) {
          setTheme(event.matches ? "light" : "dark")
        }
      } catch {
        setTheme(event.matches ? "light" : "dark")
      }
    }
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  const toggle = useCallback(
    () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    [],
  )

  return { theme, toggle }
}

export function useOnline() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  )

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener("online", up)
    window.addEventListener("offline", down)
    return () => {
      window.removeEventListener("online", up)
      window.removeEventListener("offline", down)
    }
  }, [])

  return online
}

type Connection = {
  saveData?: boolean
  effectiveType?: string
  addEventListener?: (type: string, listener: () => void) => void
  removeEventListener?: (type: string, listener: () => void) => void
}

export function useSlowConnection() {
  const read = () => {
    const connection = (
      navigator as Navigator & { connection?: Connection }
    ).connection
    return Boolean(
      connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? ""),
    )
  }
  const [slow, setSlow] = useState(read)

  useEffect(() => {
    const connection = (
      navigator as Navigator & { connection?: Connection }
    ).connection
    if (!connection?.addEventListener) return
    const update = () => setSlow(read())
    connection.addEventListener("change", update)
    return () => connection.removeEventListener?.("change", update)
  }, [])

  return slow
}

export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > threshold)
        frame = 0
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [threshold])
  return scrolled
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  )
  useEffect(() => {
    const list = window.matchMedia(query)
    const update = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(list.matches)
    list.addEventListener("change", update)
    return () => list.removeEventListener("change", update)
  }, [query])
  return matches
}

/**
 * Reveals [data-reveal] blocks as they enter the viewport.
 * The `.js` class is set in the document head, so content stays visible
 * when scripting is unavailable.
 */
export function useReveal(key: string) {
  useEffect(() => {
    const scope = document.querySelector("main")
    if (!scope) return
    const items = Array.from(scope.querySelectorAll<HTMLElement>("[data-reveal]"))
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-in"))
      return
    }

    items.forEach((item, index) => {
      const siblings = Array.from(item.parentElement?.children ?? []).filter(
        (child) => child.hasAttribute("data-reveal"),
      )
      const order = Math.min(Math.max(siblings.indexOf(item), 0), 6)
      item.style.setProperty("--reveal-delay", `${order * 55}ms`)
      if (item.getBoundingClientRect().top < window.innerHeight * 0.94) {
        item.classList.add("is-in")
      }
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add("is-in")
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
    )

    items
      .filter((item) => !item.classList.contains("is-in"))
      .forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [key])
}

export function useSearchShortcut(onTrigger: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        onTrigger()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onTrigger, enabled])
}

export function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [locked])
}

export function usePrevious<T>(value: T) {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}
