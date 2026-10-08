import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom'
import { AdminGate } from './components/AdminGate'
import { AnalyticsBootstrap } from './components/AnalyticsBootstrap'
import { AppNav } from './components/AppNav'
import { ErrorBoundary } from './components/ErrorBoundary'
import { OfflineBanner } from './components/OfflineBanner'
import { OnboardingFlow } from './components/OnboardingFlow'
import { PathMemory } from './components/PathMemory'
import { RouteScroll } from './components/RouteScroll'
import { LanguageChoiceSheet } from './components/LanguageChoiceSheet'
import { AuthProvider } from './context/AuthContext'
import { LocaleProvider, useLocale } from './context/LocaleContext'
import { NotificationsProvider } from './context/NotificationsContext'
import {
  OnboardingProvider,
  useOnboarding,
} from './context/OnboardingContext'
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
import { AdminOnboardingPage } from './pages/admin/AdminOnboardingPage'
import { AdminTipsPage } from './pages/admin/AdminTipsPage'
import { AdminTipEditPage } from './pages/admin/AdminTipEditPage'
import { AdminTipTopicsPage } from './pages/admin/AdminTipTopicsPage'
import { AdminInnsiktPage } from './pages/admin/AdminInnsiktPage'
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
import { TipsLandingPage } from './pages/TipsLandingPage'
import { TipArticlePage } from './pages/TipArticlePage'
import './App.css'

function OnboardingBootstrap() {
  const location = useLocation()
  const { loading, mode, steps, openFirst } = useOnboarding()
  const { needsLanguageChoice } = useLocale()

  useEffect(() => {
    if (needsLanguageChoice) return
    if (loading || mode !== null) return
    if (location.pathname.startsWith('/admin')) return
    if (steps.length === 0) return
    openFirst()
  }, [
    needsLanguageChoice,
    loading,
    mode,
    steps.length,
    location.pathname,
    openFirst,
  ])

  return null
}

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
      <RouteScroll />
      <PathMemory />
      <AnalyticsBootstrap />
      <LanguageChoiceSheet />
      <OnboardingBootstrap />
      <OnboardingFlow />
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
          <Route path="tips" element={<AdminTipsPage />} />
          <Route path="tips/emner" element={<AdminTipTopicsPage />} />
          <Route path="tips/new" element={<AdminTipEditPage />} />
          <Route path="tips/:id" element={<AdminTipEditPage />} />
          <Route path="onboarding" element={<AdminOnboardingPage />} />
          <Route path="innsikt" element={<AdminInnsiktPage />} />
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
        <Route path="/tips" element={<TipsLandingPage />} />
        <Route path="/tips/:slug" element={<TipArticlePage />} />
        <Route path="/favoritter" element={<FavoritesPage />} />
        <Route path="/favoritter/:folderKey" element={<FavoritesPage />} />
        <Route path="/handleliste" element={<ShoppingListPage />} />
        <Route path="/kjoleskap" element={<PantryPage />} />
        <Route path="/hjemme" element={<Navigate to="/kjoleskap" replace />} />
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
        <LocaleProvider>
          <SiteContentProvider>
            <RecipesProvider>
              <UserDataProvider>
                <NotificationsProvider>
                  <PantryProvider>
                    <ShoppingListProvider>
                      <ToastProvider>
                        <BrowserRouter>
                          <OnboardingProvider>
                            <AppChrome />
                          </OnboardingProvider>
                        </BrowserRouter>
                      </ToastProvider>
                    </ShoppingListProvider>
                  </PantryProvider>
                </NotificationsProvider>
              </UserDataProvider>
            </RecipesProvider>
          </SiteContentProvider>
        </LocaleProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
