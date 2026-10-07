import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdminGate } from './components/AdminGate'
import { AppNav } from './components/AppNav'
import { AuthProvider } from './context/AuthContext'
import { RecipesProvider } from './context/RecipesContext'
import { ShoppingListProvider } from './context/ShoppingListContext'
import { UserDataProvider } from './context/UserDataContext'
import { AdminHomePage } from './pages/admin/AdminHomePage'
import { AdminRecipeEditPage } from './pages/admin/AdminRecipeEditPage'
import { AuthPage } from './pages/AuthPage'
import { ExplorePage } from './pages/ExplorePage'
import { FavoritesPage } from './pages/FavoritesPage'
import { PantryPage } from './pages/PantryPage'
import { RecipePage } from './pages/RecipePage'
import { ShoppingListPage } from './pages/ShoppingListPage'
import './App.css'

function AppChrome() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className={isAdminRoute ? 'admin-root' : 'app-shell'}>
      {!isAdminRoute && <AppNav />}
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminGate>
              <AdminHomePage />
            </AdminGate>
          }
        />
        <Route
          path="/admin/recipes/new"
          element={
            <AdminGate>
              <AdminRecipeEditPage />
            </AdminGate>
          }
        />
        <Route
          path="/admin/recipes/:id"
          element={
            <AdminGate>
              <AdminRecipeEditPage />
            </AdminGate>
          }
        />
        <Route path="/" element={<ExplorePage />} />
        <Route path="/oppskrift/:id" element={<RecipePage />} />
        <Route path="/favoritter" element={<FavoritesPage />} />
        <Route path="/favoritter/:folderKey" element={<FavoritesPage />} />
        <Route path="/handleliste" element={<ShoppingListPage />} />
        <Route path="/hjemme" element={<PantryPage />} />
        <Route path="/mapper" element={<Navigate to="/favoritter" replace />} />
        <Route path="/konto" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <RecipesProvider>
        <UserDataProvider>
          <ShoppingListProvider>
            <BrowserRouter>
              <AppChrome />
            </BrowserRouter>
          </ShoppingListProvider>
        </UserDataProvider>
      </RecipesProvider>
    </AuthProvider>
  )
}
