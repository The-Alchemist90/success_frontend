import { api } from './api'
import { prepareImage } from './image'

export const MAX_IMAGES = 4
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

const fail = (code) => Object.assign(new Error(code), { code })
let counter = 0
const nextId = () => `m${Date.now()}-${counter++}`

/** Checks a picked file. Photos are shrunk in the browser (saves the student's data). */
export async function prepareMedia(file) {
  if (VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_BYTES) throw fail('videoSize')
    return {
      id: nextId(),
      kind: 'video',
      file,
      name: file.name || 'video',
      previewUrl: URL.createObjectURL(file),
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
    }
  }
  const image = await prepareImage(file, { maxSide: 1280, quality: 0.82 }) // throws type / size / decode / small
  return {
    id: nextId(),
    kind: 'image',
    file: image.blob,
    name: `${(file.name || 'photo').replace(/\.[^.]+$/, '')}.jpg`,
    previewUrl: image.previewUrl,
    sizeKb: image.sizeKb,
  }
}

function send(url, form, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      let data = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        /* not JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.public_id) resolve(data)
      else reject(new Error(data?.error?.message || 'upload'))
    }
    xhr.onerror = () => reject(new Error('network'))
    xhr.send(form)
  })
}

/** Step 1: ask our server for permission. Step 2: send the file straight to Cloudinary. */
export async function uploadMedia(item, onProgress = () => {}) {
  const { upload_url, fields } = await api.post('/posts/media-signature', { kind: item.kind })
  const form = new FormData()
  for (const [name, value] of Object.entries(fields)) form.append(name, value)
  form.append('file', item.file, item.name)
  const answer = await send(upload_url, form, onProgress)
  return {
    kind: item.kind,
    public_id: answer.public_id,
    version: answer.version,
    signature: answer.signature,
    size_bytes: answer.bytes || undefined,
    file_name: item.name.slice(0, 255),
  }
}