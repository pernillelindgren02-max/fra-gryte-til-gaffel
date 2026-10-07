import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom'
import { AdminGate } from './components/AdminGate'
import { AppNav } from './components/AppNav'
import { ErrorBoundary } from './components/ErrorBoundary'
import { OfflineBanner } from './components/OfflineBanner'
import { PathMemory } from './components/PathMemory'
import { AuthProvider } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { PantryProvider } from './context/PantryContext'
import { RecipesProvider } from './context/RecipesContext'
import { ShoppingListProvider } from './context/ShoppingListContext'
import { SiteContentProvider } from './context/SiteContentContext'
import { ToastProvider } from './context/ToastContext'
import { UserDataProvider } from './context/UserDataContext'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage'
import { AdminRecipesPage } from './pages/admin/AdminRecipesPage'
import { AdminRecipeEditPage } from './pages/admin/AdminRecipeEditPage'
import { AdminRecipePreviewPage } from './pages/admin/AdminRecipePreviewPage'
import { AdminExplorePage } from './pages/admin/AdminExplorePage'
import { AdminCopyPage } from './pages/admin/AdminCopyPage'
import { AdminDesignPage } from './pages/admin/AdminDesignPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { AuthPage } from './pages/AuthPage'
import { ExplorePage } from './pages/ExplorePage'
import { FavoritesPage } from './pages/FavoritesPage'
import { PantryPage } from './pages/PantryPage'
import { RecipePage } from './pages/RecipePage'
import { ShoppingListPage } from './pages/ShoppingListPage'
import './App.css'

function AdminRoutes() {
  return (
    <AdminGate>
      <AdminLayout />
    </AdminGate>
  )
}

function LegacyRecipeRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/admin/oppskrifter/${id}`} replace />
}

function LegacyConsumerRecipeRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/oppskrift/${id}`} replace />
}

function AppChrome() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className={isAdminRoute ? 'admin-root' : 'app-shell'}>
      <PathMemory />
      {!isAdminRoute && <OfflineBanner />}
      {!isAdminRoute && <AppNav />}
      <Routes>
        <Route path="/admin" element={<AdminRoutes />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="oppskrifter" element={<AdminRecipesPage />} />
          <Route path="oppskrifter/new" element={<AdminRecipeEditPage />} />
          <Route path="oppskrifter/:id" element={<AdminRecipeEditPage />} />
          <Route
            path="oppskrifter/:id/forhandsvis"
            element={<AdminRecipePreviewPage />}
          />
          <Route path="explore" element={<AdminExplorePage />} />
          <Route path="tekster" element={<AdminCopyPage />} />
          <Route path="design" element={<AdminDesignPage />} />
          <Route path="brukere" element={<AdminUsersPage />} />
          <Route path="varsler" element={<AdminNotificationsPage />} />
          <Route path="innstillinger" element={<AdminSettingsPage />} />
          <Route
            path="recipes/new"
            element={<Navigate to="/admin/oppskrifter/new" replace />}
          />
          <Route path="recipes/:id" element={<LegacyRecipeRedirect />} />
        </Route>
        <Route path="/" element={<ExplorePage />} />
        <Route path="/oppskrift/:id" element={<RecipePage />} />
        <Route
          path="/recipe/:id"
          element={<LegacyConsumerRecipeRedirect />}
        />
        <Route path="/favoritter" element={<FavoritesPage />} />
        <Route path="/favoritter/:folderKey" element={<FavoritesPage />} />
        <Route path="/handleliste" element={<ShoppingListPage />} />
        <Route path="/hjemme" element={<PantryPage />} />
        <Route path="/mapper" element={<Navigate to="/favoritter" replace />} />
        <Route path="/konto" element={<AuthPage />} />
        <Route path="/varsler" element={<Navigate to="/konto" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SiteContentProvider>
          <RecipesProvider>
            <UserDataProvider>
              <NotificationsProvider>
                <PantryProvider>
                  <ShoppingListProvider>
                    <ToastProvider>
                      <BrowserRouter>
                        <AppChrome />
                      </BrowserRouter>
                    </ToastProvider>
                  </ShoppingListProvider>
                </PantryProvider>
              </NotificationsProvider>
            </UserDataProvider>
          </RecipesProvider>
        </SiteContentProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
