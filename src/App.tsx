import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppNav } from './components/AppNav'
import { AuthProvider } from './context/AuthContext'
import { ShoppingListProvider } from './context/ShoppingListContext'
import { UserDataProvider } from './context/UserDataContext'
import { AuthPage } from './pages/AuthPage'
import { ExplorePage } from './pages/ExplorePage'
import { FavoritesPage } from './pages/FavoritesPage'
import { FoldersPage } from './pages/FoldersPage'
import { PantryPage } from './pages/PantryPage'
import { RecipePage } from './pages/RecipePage'
import { ShoppingListPage } from './pages/ShoppingListPage'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <ShoppingListProvider>
          <BrowserRouter>
            <div className="app-shell">
              <AppNav />
              <Routes>
                <Route path="/" element={<ExplorePage />} />
                <Route path="/oppskrift/:id" element={<RecipePage />} />
                <Route path="/favoritter" element={<FavoritesPage />} />
                <Route path="/handleliste" element={<ShoppingListPage />} />
                <Route path="/hjemme" element={<PantryPage />} />
                <Route path="/mapper" element={<FoldersPage />} />
                <Route path="/konto" element={<AuthPage />} />
              </Routes>
            </div>
          </BrowserRouter>
        </ShoppingListProvider>
      </UserDataProvider>
    </AuthProvider>
  )
}
