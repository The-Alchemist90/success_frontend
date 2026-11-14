import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileX } from 'lucide-react'
import PostCard, { PostSkeleton } from '../components/feed/PostCard'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../lib/toast'
import { usePrefs } from '../lib/prefs'
import { railApi } from '../lib/rail'

export default function PostPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t } = usePrefs()
  const navigate = useNavigate()
  const { notify, toast } = useToast()
  const [post, setPost] = useState(null)
  const [phase, setPhase] = useState('loading')

  useEffect(() => {
    let alive = true
    setPhase('loading')
    railApi
      .post(id)
      .then((p) => {
        if (!alive) return
        setPost(p)
        setPhase('ready')
      })
      .catch(() => alive && setPhase('gone'))
    return () => {
      alive = false
    }
  }, [id])

  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      <Link to="/" className="inline-flex w-fit items-center gap-2 rounded-lg px-2 py-1.5 text-label-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('links.back')}
      </Link>
      {phase === 'loading' && <PostSkeleton />}
      {phase === 'gone' && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-outline-variant px-6 py-14 text-center">
          <FileX className="size-9 text-on-surface-variant" aria-hidden="true" />
          <p className="text-body-md text-on-surface-variant">{t('links.postGone')}</p>
        </div>
      )}
      {phase === 'ready' && (
        <PostCard
          post={post}
          me={user}
          defaultComments
          notify={notify}
          onPatch={(_, change) => setPost((p) => ({ ...p, ...change }))}
          onDeleted={() => navigate('/', { replace: true })}
        />
      )}
      {toast}
    </div>
  )
}