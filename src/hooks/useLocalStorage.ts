import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

// Checks that a value read back from storage really has the shape we expect.
// "value is T" makes this a type guard: when it returns true, TypeScript
// treats the value as a T from then on.
export type Validator<T> = (value: unknown) => value is T

// Reads and parses a saved value. Falls back when:
// - nothing has been saved under this key yet,
// - the saved text isn't valid JSON,
// - the JSON doesn't have the right shape, or
// - localStorage can't be used at all (e.g. blocked by browser settings).
function readSavedValue<T>(key: string, fallback: T, isValid: Validator<T>): T {
  try {
    const savedText = window.localStorage.getItem(key)
    if (savedText === null) {
      return fallback
    }
    // JSON.parse could return anything, so treat it as unknown until checked.
    const savedValue: unknown = JSON.parse(savedText)
    return isValid(savedValue) ? savedValue : fallback
  } catch {
    return fallback
  }
}

// Works like useState, but the value is also saved in the browser's
// localStorage under `key`, so it survives a page refresh.
export function useLocalStorage<T>(
  key: string,
  fallback: T,
  isValid: Validator<T>,
): [T, Dispatch<SetStateAction<T>>] {
  // Passing a function to useState means it only runs on the first render,
  // so we read from storage once, not on every render.
  const [value, setValue] = useState<T>(() => readSavedValue(key, fallback, isValid))

  // Save whenever the value changes.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage is full or blocked. The app keeps working with the value in
      // memory; it just won't be remembered after a refresh.
    }
  }, [key, value])

  return [value, setValue]
}
