import { api } from './api'


function sendToCloudinary(url, form, onProgress) {
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
        
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.public_id) resolve(data)
      else reject(new Error(data?.error?.message || 'upload'))
    }
    xhr.onerror = () => reject(new Error('network'))
    xhr.send(form)
  })
}


export async function uploadAvatar(blob, onProgress = () => {}) {
  const { upload_url, fields } = await api.post('/users/me/avatar/signature')
  const form = new FormData()
  for (const [name, value] of Object.entries(fields)) form.append(name, value)
  form.append('file', blob, 'avatar.jpg')
  const answer = await sendToCloudinary(upload_url, form, onProgress)
  return api.put('/users/me/avatar', {
    public_id: answer.public_id,
    version: answer.version,
    signature: answer.signature,
  })
}

export function removeAvatar() {
  return api.delete('/users/me/avatar')
}