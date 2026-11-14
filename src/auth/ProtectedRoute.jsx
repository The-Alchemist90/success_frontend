import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Spinner } from '../components/ui'
import { usePrefs } from '../lib/prefs'

export default function ProtectedRoute() {
  const { status } = useAuth()
  const { t } = usePrefs()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-on-surface-variant" role="status">
        <Spinner className="size-5" />
        <span>{t('common.loading')}</span>
      </div>
    )
  }
  if (status === 'anonymous') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}