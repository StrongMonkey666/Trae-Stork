import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import StrategyList from './pages/Strategy/StrategyList';
import StrategyEditor from './pages/Strategy/StrategyEditor';
import BacktestConfig from './pages/Backtest/BacktestConfig';
import MarketWatch from './pages/Market/MarketWatch';
import TechnicalAnalysis from './pages/Technical/TechnicalAnalysis';
import PortfolioOverview from './pages/Portfolio/PortfolioOverview';
import Profile from './pages/User/Profile';
import ProtectedRoute from './components/common/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'strategies',
        element: <StrategyList />,
      },
      {
        path: 'strategies/new',
        element: <StrategyEditor />,
      },
      {
        path: 'strategies/:id',
        element: <StrategyEditor />,
      },
      {
        path: 'backtest',
        element: <BacktestConfig />,
      },
      {
        path: 'market',
        element: <MarketWatch />,
      },
      {
        path: 'technical',
        element: <TechnicalAnalysis />,
      },
      {
        path: 'portfolio',
        element: <PortfolioOverview />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
]);
