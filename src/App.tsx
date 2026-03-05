import { useState } from 'react'
import { VersionProvider } from '@/contexts/VersionContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import LandingPage from '@/pages/LandingPage'
import AnalyzerPage from '@/pages/AnalyzerPage'
import CallGraphPage from '@/pages/CallGraphPage'
import MasterThreadPage from '@/pages/MasterThreadPage'
import GdbLabPage from '@/pages/GdbLabPage'
import FlameGraphPage from '@/pages/FlameGraphPage'
import CallChainPage from '@/pages/CallChainPage'
import VersionConfigPage from '@/pages/VersionConfigPage'
import AuthPage from '@/pages/AuthPage'
import AdminPage from '@/pages/AdminPage'

export type Route = 'landing' | 'analyzer' | 'callgraph' | 'masterthread' | 'gdblab' | 'flamegraph' | 'callchain' | 'versionconfig' | 'auth' | 'admin'

// 不需要登录即可访问的页面
const PUBLIC_ROUTES: Route[] = ['landing', 'auth']

// 需要管理员权限的页面
const ADMIN_ROUTES: Route[] = ['admin']

function AppRoutes() {
  const [currentRoute, setCurrentRoute] = useState<Route>('landing')
  const { isAuthenticated, isAdmin } = useAuth()

  const navigateTo = (route: Route) => {
    // 未登录时，访问非公开页面 → 跳转登录
    if (!isAuthenticated && !PUBLIC_ROUTES.includes(route)) {
      setCurrentRoute('auth')
      window.scrollTo(0, 0)
      return
    }
    // 非管理员访问管理页面 → 跳转首页
    if (ADMIN_ROUTES.includes(route) && !isAdmin) {
      setCurrentRoute('landing')
      window.scrollTo(0, 0)
      return
    }
    setCurrentRoute(route)
    window.scrollTo(0, 0)
  }

  // 认证守卫：未登录时除公开页面外，强制显示登录页
  const getEffectiveRoute = (): Route => {
    if (!isAuthenticated && !PUBLIC_ROUTES.includes(currentRoute)) {
      return 'auth'
    }
    if (ADMIN_ROUTES.includes(currentRoute) && !isAdmin) {
      return 'landing'
    }
    return currentRoute
  }

  const effectiveRoute = getEffectiveRoute()

  const renderPage = () => {
    switch (effectiveRoute) {
      case 'analyzer':
        return <AnalyzerPage onNavigate={navigateTo} />
      case 'callgraph':
        return <CallGraphPage onNavigate={navigateTo} />
      case 'masterthread':
        return <MasterThreadPage onNavigate={navigateTo} />
      case 'gdblab':
        return <GdbLabPage onNavigate={navigateTo} />
      case 'flamegraph':
        return <FlameGraphPage onNavigate={navigateTo} />
      case 'callchain':
        return <CallChainPage onNavigate={navigateTo} />
      case 'versionconfig':
        return <VersionConfigPage onNavigate={navigateTo} />
      case 'auth':
        return <AuthPage onNavigate={navigateTo} />
      case 'admin':
        return <AdminPage onNavigate={navigateTo} />
      default:
        return <LandingPage onNavigate={navigateTo} />
    }
  }

  return <>{renderPage()}</>
}

export default function App() {
  return (
    <AuthProvider>
      <VersionProvider>
        <AppRoutes />
      </VersionProvider>
    </AuthProvider>
  )
}
