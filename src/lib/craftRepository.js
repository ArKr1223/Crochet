import { supabase } from './supabaseClient'

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
  status: row.status ?? '進行中',
  progress: row.progress ?? 0,
  currentStep: row.current_step ?? '',
  image: row.image_url ?? '',
  notes: row.notes ?? '',
})

const projectToRow = (project, userId) => ({
  user_id: userId,
  pattern_id: project.patternId,
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
  const patterns = (patternRows ?? []).map((row) => patternFromRow(row, links))
  const yarns = (yarnRows ?? []).map((row) => ({
    ...yarnFromRow(row),
    linkedPatternIds: links
      .filter((link) => link.yarn_id === row.id)
      .map((link) => link.pattern_id),
  }))
  const projects = (projectRows ?? []).map(projectFromRow)

  return { yarns, patterns, projects }
}

export async function createYarn(yarn, userId) {
  const { data, error } = await requireSupabase()
    .from('yarns')
    .insert(yarnToRow(yarn, userId))
    .select()
    .single()
  if (error) throw error
  return yarnFromRow(data)
}

export async function createPattern(pattern, userId) {
  const { data, error } = await requireSupabase()
    .from('patterns')
    .insert(patternToRow(pattern, userId))
    .select()
    .single()
  if (error) throw error
  return patternFromRow(data, [])
}

export async function createProject(project, userId) {
  const { data, error } = await requireSupabase()
    .from('projects')
    .insert(projectToRow(project, userId))
    .select()
    .single()
  if (error) throw error
  return projectFromRow(data)
}

export async function updateYarnImage(yarnId, image) {
  const { error } = await requireSupabase()
    .from('yarns')
    .update({ image_url: image })
    .eq('id', yarnId)
  if (error) throw error
}

export async function updatePatternImage(patternId, image) {
  const { error } = await requireSupabase()
    .from('patterns')
    .update({ image_url: image })
    .eq('id', patternId)
  if (error) throw error
}

export async function updateProjectImage(projectId, image) {
  const { error } = await requireSupabase()
    .from('projects')
    .update({ image_url: image })
    .eq('id', projectId)
  if (error) throw error
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
