export const IMAGE_MAX_BYTES = 800 * 1024

export async function compressImageFile(file) {
  const image = new Image()
  const objectUrl = URL.createObjectURL(file)
  const canvas = document.createElement('canvas')
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('照片讀取逾時，請重新選取照片。')), 30000)
      image.onload = () => { clearTimeout(timer); resolve() }
      image.onerror = () => {
        clearTimeout(timer)
        reject(new Error('無法讀取這張照片，請改選 JPG、PNG 或可正常開啟的照片。'))
      }
      image.src = objectUrl
    })
    const context = canvas.getContext('2d')
    if (!context) throw new Error('無法處理照片，請重新開啟頁面後再試。')
    let edge = Math.min(1600, Math.max(image.naturalWidth, image.naturalHeight))
    for (let attempt = 0; attempt < 7; attempt += 1) {
      const scale = edge / Math.max(image.naturalWidth, image.naturalHeight)
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      for (const quality of [0.84, 0.74, 0.64]) {
        let blob = await encode(canvas, 'image/webp', quality)
        // Safari may return PNG when WebP encoding is unsupported.
        if (!blob || blob.type !== 'image/webp') blob = await encode(canvas, 'image/jpeg', quality)
        if (blob && blob.size <= IMAGE_MAX_BYTES) {
          const extension = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }[blob.type]
          if (!extension) throw new Error('照片格式轉換失敗。')
          return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${extension}`, { type: blob.type })
        }
      }
      edge = Math.floor(edge * 0.75)
    }
    throw new Error('照片仍然太大，請裁切後重新選取。')
  } finally {
    URL.revokeObjectURL(objectUrl)
    canvas.width = 0
    canvas.height = 0
  }
}

function encode(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('照片處理逾時，請改選較小的照片。')), 15000)
    canvas.toBlob((blob) => { clearTimeout(timer); resolve(blob) }, type, quality)
  })
}
