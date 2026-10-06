import { createContext, useContext, type ReactNode } from 'react'
import { useFavorites } from '../hooks/useFavorites'
import { useFolders } from '../hooks/useFolders'

type UserDataContextValue = ReturnType<typeof useFavorites> &
  ReturnType<typeof useFolders>

const UserDataContext = createContext<UserDataContextValue | null>(null)

export function UserDataProvider({ children }: { children: ReactNode }) {
  const favorites = useFavorites()
  const folders = useFolders()

  return (
    <UserDataContext.Provider value={{ ...favorites, ...folders }}>
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  const ctx = useContext(UserDataContext)
  if (!ctx) throw new Error('useUserData must be used within UserDataProvider')
  return ctx
}
