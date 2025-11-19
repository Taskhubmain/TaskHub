import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { RegionProvider } from './contexts/RegionContext';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import { DbStatus } from './components/DbStatus';
import LearningPrompt from './components/LearningPrompt';
import { BanCheck } from './components/BanCheck';
import { useActivityTracker } from './hooks/useActivityTracker';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFound from './pages/NotFound';
import OAuthCallback from './pages/OAuthCallback';

const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrderCreatePage = lazy(() => import('./pages/OrderCreatePage'));
const OrderEditPage = lazy(() => import('./pages/OrderEditPage'));
const TaskCreatePage = lazy(() => import('./pages/TaskCreatePage'));
const TaskEditPage = lazy(() => import('./pages/TaskEditPage'));
const MarketPage = lazy(() => import('./pages/MarketPage'));
const MyDealsPage = lazy(() => import('./pages/MyDealsPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const TaskDetailPage = lazy(() => import('./pages/TaskDetailPage'));
const ProposalsPage = lazy(() => import('./pages/ProposalsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ProposalsCreate = lazy(() => import('./pages/proposals/Create'));
const PublicProfile = lazy(() => import('./pages/users/PublicProfile'));
const PortfolioAdd = lazy(() => import('./pages/me/PortfolioAdd'));
const DealOpen = lazy(() => import('./pages/deal/Open'));
const BlockedUsersPage = lazy(() => import('./pages/BlockedUsersPage'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminDeals = lazy(() => import('./pages/admin/AdminDeals'));
const AdminFinance = lazy(() => import('./pages/admin/AdminFinance'));
const AdminModeration = lazy(() => import('./pages/admin/AdminModeration'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminSuggestions = lazy(() => import('./pages/admin/AdminSuggestions'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const ProfileCompletionPage = lazy(() => import('./pages/ProfileCompletionPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const LearningPage = lazy(() => import('./pages/LearningPage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
const SecuritySettingsPage = lazy(() => import('./pages/SecuritySettingsPage'));
const DisputePage = lazy(() => import('./pages/DisputePage'));
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import MediaLibraryPage from './pages/MediaLibraryPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import WalletPage from './pages/WalletPage';
import {
  DealPage,
  NotificationsPage,
  SavedPage,
  DisputesPage,
  SettingsProfilePage,
  SettingsSecurityPage,
  OnboardingPage,
  AdminPage,
  TermsPage,
  PrivacyPage,
  PaymentsPage,
  FAQPage,
  ContactPage,
  NotFoundPage
} from './pages/AllPages';

function AppContent() {
  useActivityTracker();
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => {
      // Check full hash including params
      const fullHash = window.location.hash;

      // Handle OAuth callback with access_token in hash
      if (fullHash.includes('access_token=')) {
        console.log('OAuth callback detected, showing callback page...');
        setRoute('/oauth-callback');
        return;
      }

      const hash = fullHash.slice(1) || '/';
      const routeWithoutQuery = hash.split('?')[0];
      setRoute(routeWithoutQuery);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  let Page;

  if (route === '/oauth-callback') {
    Page = OAuthCallback;
  } else if (route === '/') {
    Page = HomePage;
  } else if (route === '/auth/login' || route === '/login') {
    Page = LoginPage;
  } else if (route === '/auth/register' || route === '/register') {
    Page = RegisterPage;
  } else if (route === '/profile-completion') {
    Page = ProfileCompletionPage;
  } else if (route === '/onboarding') {
    Page = OnboardingPage;
  } else if (route === '/me' || route === '/profile') {
    Page = ProfilePage;
  } else if (route === '/me/edit') {
    Page = ProfilePage;
  } else if (route === '/my-deals') {
    Page = MyDealsPage;
  } else if (route === '/me/portfolio') {
    Page = ProfilePage;
  } else if (route.startsWith('/me/portfolio/add')) {
    Page = PortfolioAdd;
  } else if (route === '/orders') {
    Page = MarketPage;
  } else if (route === '/orders/create' || route === '/order/new') {
    Page = OrderCreatePage;
  } else if (route.match(/^\/order\/[^\/]+\/edit$/)) {
    Page = OrderEditPage;
  } else if (route.startsWith('/order/')) {
    Page = OrderDetailPage;
  } else if (route.startsWith('/orders/')) {
    Page = OrderDetailPage;
  } else if (route === '/tasks') {
    Page = MarketPage;
  } else if (route === '/tasks/create' || route === '/task/new') {
    Page = TaskCreatePage;
  } else if (route.match(/^\/task\/[^\/]+\/edit$/)) {
    Page = TaskEditPage;
  } else if (route.startsWith('/task/')) {
    Page = TaskDetailPage;
  } else if (route.startsWith('/tasks/')) {
    Page = TaskDetailPage;
  } else if (route === '/proposals') {
    Page = ProposalsPage;
  } else if (route.startsWith('/proposals/create')) {
    Page = ProposalsCreate;
  } else if (route.startsWith('/messages/')) {
    Page = MessagesPage;
  } else if (route === '/messages') {
    Page = MessagesPage;
  } else if (route.startsWith('/deal/open')) {
    Page = DealOpen;
  } else if (route.startsWith('/deal/')) {
    Page = DealPage;
  } else if (route === '/wallet') {
    Page = WalletPage;
  } else if (route === '/reviews') {
    Page = ProfilePage;
  } else if (route.startsWith('/u/') || route.startsWith('/users/')) {
    Page = PublicProfile;
  } else if (route === '/notifications') {
    Page = NotificationsPage;
  } else if (route === '/saved') {
    Page = SavedPage;
  } else if (route.startsWith('/dispute/')) {
    Page = DisputePage;
  } else if (route === '/disputes') {
    Page = DisputesPage;
  } else if (route === '/settings/profile') {
    Page = SettingsProfilePage;
  } else if (route === '/settings/security') {
    Page = SecuritySettingsPage;
  } else if (route === '/settings/notifications') {
    Page = NotificationSettingsPage;
  } else if (route === '/settings/payments' || route === '/payment-methods') {
    Page = PaymentMethodsPage;
  } else if (route === '/settings/blocked' || route === '/blocked-users') {
    Page = BlockedUsersPage;
  } else if (route === '/media' || route === '/media-library') {
    Page = MediaLibraryPage;
  } else if (route === '/recommendations') {
    Page = RecommendationsPage;
  } else if (route === '/admin/login') {
    Page = AdminLogin;
  } else if (route === '/admin') {
    Page = AdminDashboard;
  } else if (route === '/admin/settings') {
    Page = AdminSettings;
  } else if (route === '/admin/users') {
    Page = AdminUsers;
  } else if (route === '/admin/deals') {
    Page = AdminDeals;
  } else if (route === '/admin/finance') {
    Page = AdminFinance;
  } else if (route === '/admin/categories') {
    Page = AdminCategories;
  } else if (route === '/admin/moderation') {
    Page = AdminModeration;
  } else if (route === '/admin/suggestions') {
    Page = AdminSuggestions;
  } else if (route === '/terms') {
    Page = TermsPage;
  } else if (route === '/privacy') {
    Page = PrivacyPage;
  } else if (route === '/payments') {
    Page = PaymentsPage;
  } else if (route === '/faq') {
    Page = FAQPage;
  } else if (route === '/contact') {
    Page = ContactPage;
  } else if (route === '/market' || route.startsWith('/market?')) {
    Page = MarketPage;
  } else if (route === '/categories') {
    Page = CategoriesPage;
  } else if (route === '/learning') {
    Page = LearningPage;
  } else if (route === '/404') {
    Page = NotFound;
  } else {
    Page = NotFound;
  }

  const isAuthPage = route === '/login' || route === '/register' || route === '/auth/login' || route === '/auth/register' || route === '/onboarding' || route === '/profile-completion' || route === '/oauth-callback';
  const isAdminPage = route.startsWith('/admin');
  const isAdminLoginPage = route === '/admin/login';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isAuthPage && !isAdminPage && <NavBar />}
      <BanCheck>
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#6FE7C8] border-r-transparent"></div>
                  <p className="mt-4 text-[#3F7F6E]">Загрузка...</p>
                </div>
              </div>
            }>
              {isAdminPage && !isAdminLoginPage ? (
                <AdminLayout currentPage={route}>
                  <Page />
                </AdminLayout>
              ) : (
                <Page />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </BanCheck>
      {!isAuthPage && !isAdminPage && <Footer />}
      {!isAdminPage && <DbStatus />}
      <LearningPrompt />
    </div>
  );
}

function App() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const testSupabase = import.meta.env.VITE_SUPABASE_URL;
      if (!testSupabase) {
        setError('Supabase URL not configured');
        console.error('Missing VITE_SUPABASE_URL');
      }
    } catch (err) {
      setError('Failed to initialize application');
      console.error('App initialization error:', err);
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Check console for details</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <RegionProvider>
        <AppContent />
      </RegionProvider>
    </AuthProvider>
  );
}

export default App;
