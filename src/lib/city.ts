import { cities } from "../data/companies"

const KEY = "sa-city"

export function getLastCity() {
  try {
    const value = window.localStorage.getItem(KEY)
    if (value && cities.some((city) => city.id === value)) return value
  } catch {
    /* storage can be unavailable */
  }
  return null
}

export function setLastCity(id: string) {
  try {
    window.localStorage.setItem(KEY, id)
  } catch {
    /* storage can be unavailable */
  }
}

export function cityFromParam(value: string | null) {
  return cities.find((city) => city.id === value)?.id ?? null
}
