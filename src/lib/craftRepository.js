import { supabase } from './supabaseClient'
import { IMAGE_MAX_BYTES } from './imageCompression'

const IMAGE_BUCKET = 'craft-images'
const SIGNED_IMAGE_SECONDS = 60 * 60 * 24

const isExternalImage = (value = '') =>
  value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')

async function imageUrlFromPath(path) {
  if (!path || isExternalImage(path)) return path ?? ''

  const { data, error } = await requireSupabase()
    .storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(path, SIGNED_IMAGE_SECONDS)

  if (error) throw error
  return data.signedUrl
}

const yarnFromRow = (row) => ({
  id: row.id,
  name: row.name,
  brand: row.brand ?? '',
  color: row.color ?? '',
  colorHex: row.color_hex ?? '#8aa694',
  material: row.material ?? '',
  weight: row.weight ?? '',
  yardage: row.yardage ?? '',
  quantity: row.quantity ?? 0,
  price: row.price ?? '',
  purchasePlace: row.purchase_place ?? '',
  notes: row.notes ?? '',
  storage: row.storage ?? '',
  image: row.image_url ?? '',
  linkedPatternIds: [],
})

const yarnToRow = (yarn, userId) => ({
  id: yarn.id,
  user_id: userId,
  name: yarn.name,
  brand: yarn.brand,
  color: yarn.color,
  color_hex: yarn.colorHex,
  material: yarn.material,
  weight: yarn.weight,
  yardage: yarn.yardage,
  quantity: yarn.quantity,
  price: yarn.price,
  purchase_place: yarn.purchasePlace,
  notes: yarn.notes,
  storage: yarn.storage,
  image_url: yarn.image,
})

const patternFromRow = (row, links) => ({
  id: row.id,
  name: row.name,
  category: row.category ?? '',
  sourceType: row.source_type ?? 'photo',
  source: row.source_url ?? '',
  image: row.image_url ?? '',
  notes: row.notes ?? '',
  yarnUsage: links
    .filter((link) => link.pattern_id === row.id)
    .map((link) => ({ yarnId: link.yarn_id, amount: link.usage_amount ?? '' })),
})

const patternToRow = (pattern, userId) => ({
  id: pattern.id,
  user_id: userId,
  name: pattern.name,
  category: pattern.category,
  source_type: pattern.sourceType,
  source_url: pattern.source,
  image_url: pattern.image,
  notes: pattern.notes,
})

const projectFromRow = (row) => ({
  id: row.id,
  name: row.name,
  patternId: row.pattern_id,
  startDate: row.start_date ?? '',
  endDate: row.end_date ?? '',
  workType: row.work_type ?? '',
  yarnDescription: row.yarn_description ?? '',
  toolType: row.tool_type ?? '',
  hookSize: row.hook_size ?? '',
  status: row.status ?? '進行中',
  progress: row.progress ?? 0,
  currentStep: row.current_step ?? '',
  image: row.image_url ?? '',
  notes: row.notes ?? '',
})

const projectToRow = (project, userId) => ({
  id: project.id,
  user_id: userId,
  pattern_id: project.patternId || null,
  start_date: project.startDate || null,
  end_date: project.endDate || null,
  work_type: project.workType || '',
  yarn_description: project.yarnDescription || '',
  tool_type: project.toolType || null,
  hook_size: project.hookSize || '',
  name: project.name,
  status: project.status,
  progress: project.progress,
  current_step: project.currentStep,
  image_url: project.image,
  notes: project.notes,
})

const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

async function yarnFromRowWithImage(row) {
  return {
    ...yarnFromRow(row),
    image: await imageUrlFromPath(row.image_url),
    imagePath: row.image_url ?? '',
  }
}

async function patternFromRowWithImage(row, links) {
  return {
    ...patternFromRow(row, links),
    image: await imageUrlFromPath(row.image_url),
    imagePath: row.image_url ?? '',
  }
}

async function projectFromRowWithImage(row) {
  return {
    ...projectFromRow(row),
    image: await imageUrlFromPath(row.image_url),
    imagePath: row.image_url ?? '',
  }
}

export async function uploadCraftImage(file, userId, entityType, entityId) {
  const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[file.type]
  if (!extension) throw new Error('請選擇 JPG、PNG 或 WebP 照片。')
  if (file.size > IMAGE_MAX_BYTES) throw new Error('照片超過 800 KB，請重新選取以壓縮。')
  const path = `${userId}/${entityType}/${entityId}-${Date.now()}.${extension}`
  const { error } = await requireSupabase()
    .storage
    .from(IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type || 'image/webp',
      upsert: false,
    })

  if (error) throw new Error(`照片上傳失敗：${error.message}`)
  return {
    path,
    url: await imageUrlFromPath(path),
  }
}

export async function loadCraftData() {
  const client = requireSupabase()
  const [{ data: yarnRows, error: yarnError }, { data: patternRows, error: patternError }, { data: linkRows, error: linkError }, { data: projectRows, error: projectError }] =
    await Promise.all([
      client.from('yarns').select('*').order('created_at', { ascending: false }),
      client.from('patterns').select('*').order('created_at', { ascending: false }),
      client.from('pattern_yarns').select('*'),
      client.from('projects').select('*').order('created_at', { ascending: false }),
    ])

  const error = yarnError ?? patternError ?? linkError ?? projectError
  if (error) throw error

  const links = linkRows ?? []
  const patterns = await Promise.all(
    (patternRows ?? []).map((row) => patternFromRowWithImage(row, links)),
  )
  const yarns = await Promise.all((yarnRows ?? []).map(async (row) => ({
    ...(await yarnFromRowWithImage(row)),
    linkedPatternIds: links
      .filter((link) => link.yarn_id === row.id)
      .map((link) => link.pattern_id),
  })))
  const projects = await Promise.all((projectRows ?? []).map(projectFromRowWithImage))

  return { yarns, patterns, projects }
}

export async function createYarn(yarn, userId) {
  const { data, error } = await requireSupabase()
    .from('yarns')
    .insert(yarnToRow(yarn, userId))
    .select()
    .single()
  if (error) throw error
  return { ...yarnFromRow(data), imagePath: data.image_url, image: yarn.displayImage || yarn.image }
}

export async function createPattern(pattern, userId) {
  const { data, error } = await requireSupabase()
    .from('patterns')
    .insert(patternToRow(pattern, userId))
    .select()
    .single()
  if (error) throw error
  return { ...patternFromRow(data, []), imagePath: data.image_url, image: pattern.displayImage || pattern.image }
}

export async function createProject(project, userId) {
  const { data, error } = await requireSupabase()
    .from('projects')
    .insert(projectToRow(project, userId))
    .select()
    .single()
  if (error) throw error
  return { ...projectFromRow(data), imagePath: data.image_url, image: project.displayImage || project.image }
}

export async function updateYarn(yarn, userId) {
  const { data, error } = await requireSupabase().from('yarns')
    .update({ ...yarnToRow(yarn, userId), updated_at: new Date().toISOString() })
    .eq('id', yarn.id).eq('user_id', userId).select().single()
  if (error) throw error
  return { ...yarnFromRow(data), linkedPatternIds: yarn.linkedPatternIds ?? [], imagePath: data.image_url, image: yarn.displayImage ?? yarn.image }
}

export async function updatePattern(pattern, userId) {
  const { data, error } = await requireSupabase().from('patterns')
    .update({ ...patternToRow(pattern, userId), updated_at: new Date().toISOString() })
    .eq('id', pattern.id).eq('user_id', userId).select().single()
  if (error) throw error
  return { ...patternFromRow(data, []), yarnUsage: pattern.yarnUsage ?? [], imagePath: data.image_url, image: pattern.displayImage ?? pattern.image }
}

export async function updateProject(project, userId) {
  const { data, error } = await requireSupabase().from('projects')
    .update({ ...projectToRow(project, userId), updated_at: new Date().toISOString() })
    .eq('id', project.id).eq('user_id', userId).select().single()
  if (error) throw error
  return { ...projectFromRow(data), imagePath: data.image_url, image: project.displayImage ?? project.image }
}

export async function updateYarnImage(yarnId, imagePath) {
  const { error } = await requireSupabase()
    .from('yarns')
    .update({ image_url: imagePath })
    .eq('id', yarnId)
  if (error) throw error
  return imageUrlFromPath(imagePath)
}

export async function updatePatternImage(patternId, imagePath) {
  const { error } = await requireSupabase()
    .from('patterns')
    .update({ image_url: imagePath })
    .eq('id', patternId)
  if (error) throw error
  return imageUrlFromPath(imagePath)
}

export async function updateProjectImage(projectId, imagePath) {
  const { error } = await requireSupabase()
    .from('projects')
    .update({ image_url: imagePath })
    .eq('id', projectId)
  if (error) throw error
  return imageUrlFromPath(imagePath)
}

export async function deleteYarnById(yarnId) {
  const { error } = await requireSupabase().from('yarns').delete().eq('id', yarnId)
  if (error) throw error
}

export async function deletePatternById(patternId) {
  const { error } = await requireSupabase().from('patterns').delete().eq('id', patternId)
  if (error) throw error
}

export async function deleteProjectById(projectId) {
  const { error } = await requireSupabase().from('projects').delete().eq('id', projectId)
  if (error) throw error
}
