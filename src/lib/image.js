

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_INPUT_BYTES = 15 * 1024 * 1024
const MIN_SIDE = 200

function fail(code) {
  return Object.assign(new Error(code), { code })
}


export function fitWithin(width, height, max) {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
    
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(fail('decode'))
    }
    img.src = url
  })
}


export async function prepareImage(file, { maxSide = 1024, quality = 0.85 } = {}) {
  if (!ACCEPTED_TYPES.includes(file.type)) throw fail('type')
  if (file.size > MAX_INPUT_BYTES) throw fail('size')

  let source
  try {
    source = await decode(file)
  } catch {
    throw fail('decode')
  }

  const sourceWidth = source.width ?? source.naturalWidth
  const sourceHeight = source.height ?? source.naturalHeight
  if (Math.min(sourceWidth, sourceHeight) < MIN_SIDE) {
    source.close?.()
    throw fail('small')
  }

  const { width, height } = fitWithin(sourceWidth, sourceHeight, maxSide)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff' 
  context.fillRect(0, 0, width, height)
  context.drawImage(source, 0, 0, width, height)
  source.close?.()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) throw fail('decode')

  return {
    blob,
    previewUrl: URL.createObjectURL(blob),
    sizeKb: Math.max(1, Math.round(blob.size / 1024)),
    width,
    height,
  }
}