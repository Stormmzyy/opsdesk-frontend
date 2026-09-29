import { useFetch } from '../../../hooks/useFetch.ts'
import type { FetchResult } from '../../../hooks/useFetch.ts'
import type { User } from '../types.ts'

const USERS_API_URL = 'https://jsonplaceholder.typicode.com/users'

// Loads the users from the JSONPlaceholder API.
// <User[]> tells useFetch what the JSON will look like, so `data` is
// typed as User[] | null.
export function useUsers(): FetchResult<User[]> {
  return useFetch<User[]>(USERS_API_URL)
}
