import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import AppLayout from './components/shell/AppLayout'
import { Spinner } from './components/ui'
import CoursePage from './pages/CoursePage'
import Courses from './pages/Courses'
import Feed from './pages/Feed'
import Friends from './pages/Friends'
import Home from './pages/Home'
import Login from './pages/Login'
import Messages from './pages/Messages'
import PostPage from './pages/PostPage'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'

// The lesson reader (with the Markdown engine) is only downloaded when a student opens a lesson.
const LessonPage = lazy(() => import('./pages/LessonPage'))

const Fallback = () => (
  <div className="flex justify-center py-24 text-on-surface-variant" role="status">
    <Spinner className="size-6" />
  </div>
)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Feed />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/learn" element={<Courses />} />
          <Route
            path="/learn/lesson/:lessonId"
            element={
              <Suspense fallback={<Fallback />}>
                <LessonPage />
              </Suspense>
            }
          />
          <Route path="/learn/:courseId" element={<CoursePage />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<Messages />} />
          <Route path="/profile" element={<Home />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}