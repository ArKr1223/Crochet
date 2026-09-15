import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  FileText,
  Folder,
  Gauge,
  Grid2X2,
  Home,
  ImagePlus,
  List,
  MoreHorizontal,
  PackagePlus,
  Palette,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  patterns as seedPatterns,
  projects as seedProjects,
  yarns as seedYarns,
} from './data/seed'
import {
  createPattern,
  createProject,
  createYarn,
  deletePatternById,
  deleteProjectById,
  deleteYarnById,
  loadCraftData,
  updatePatternImage,
  updateProjectImage,
  updateYarnImage,
  uploadCraftImage,
} from './lib/craftRepository'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient'

const navigation = [
  { id: 'overview', label: '總覽', icon: Home },
  { id: 'yarns', label: '線材', icon: Palette },
  { id: 'patterns', label: '織圖', icon: BookOpen },
  { id: 'projects', label: '專案', icon: Folder },
  { id: 'settings', label: '設定', icon: Settings },
]

const entityCopy = {
  yarns: { title: '線材', unit: '種', add: '新增線材', search: '搜尋線材名稱、顏色、材質' },
  patterns: { title: '織圖', unit: '個', add: '新增織圖', search: '搜尋織圖名稱、類別、來源' },
  projects: { title: '專案', unit: '個', add: '新增專案', search: '搜尋專案名稱、狀態、目前進度' },
}

const allowedEmail = import.meta.env.VITE_ALLOWED_EMAIL?.trim().toLowerCase() ?? ''
const imageCompressionTarget = 800 * 1024
const imageCompressionMinQuality = 0.62
const shouldBlockUnconfiguredProduction = import.meta.env.PROD && !isSupabaseConfigured

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const blobToDataUrl = fileToDataUrl

async function compressImageFile(file) {
  if (!file.type.startsWith('image/')) return file

  const image = new Image()
  const objectUrl = URL.createObjectURL(file)

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
      image.src = objectUrl
    })

    const scale = Math.min(1, 1600 / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))

    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    let quality = 0.82
    let blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality),
    )

    while (blob?.size > imageCompressionTarget && quality > imageCompressionMinQuality) {
      quality -= 0.08
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/webp', quality),
      )
    }

    if (!blob) return file

    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, {
      type: 'image/webp',
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

const isAllowedEmail = (email = '') =>
  !allowedEmail || email.trim().toLowerCase() === allowedEmail

const fallbackImage = (label = 'Photo', color = '#8aa694') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650">
      <rect width="900" height="650" fill="#edf4ef"/>
      <circle cx="450" cy="315" r="170" fill="${color}"/>
      <path d="M300 260c82-62 218-62 300 0M292 328c94-72 222-72 316 0M316 392c78-50 190-50 268 0" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="30" stroke-linecap="round"/>
      <text x="450" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#293331">${label}</text>
    </svg>
  `)}`

const extractMaterials = (material = '') =>
  material
    .replace(/\d+%/g, '')
    .split(/[、,，/]/)
    .map((item) => item.trim())
    .filter(Boolean)

function App() {
  const [activeNav, setActiveNav] = useState('overview')
  const [query, setQuery] = useState('')
  const [materialFilter, setMaterialFilter] = useState('全部材質')
  const [viewMode, setViewMode] = useState('list')
  const [listWidth, setListWidth] = useState(380)
  const [modalType, setModalType] = useState(null)
  const [yarns, setYarns] = useState(seedYarns)
  const [patterns, setPatterns] = useState(seedPatterns)
  const [projects, setProjects] = useState(seedProjects)
  const [selectedYarnId, setSelectedYarnId] = useState(seedYarns[0].id)
  const [selectedPatternId, setSelectedPatternId] = useState(seedPatterns[0].id)
  const [selectedProjectId, setSelectedProjectId] = useState(seedProjects[0].id)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [user, setUser] = useState(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [dataStatus, setDataStatus] = useState(
    isSupabaseConfigured ? '等待登入' : '使用本機範例資料',
  )
  const importInputRef = useRef(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined

    let mounted = true

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        setAuthMessage(error.message)
        return
      }
      if (data.user && !isAllowedEmail(data.user.email)) {
        supabase.auth.signOut()
        setAuthMessage(`此網站只允許 ${allowedEmail} 登入。`)
        return
      }
      setUser(data.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !isAllowedEmail(session.user.email)) {
        supabase.auth.signOut()
        setUser(null)
        setAuthMessage(`此網站只允許 ${allowedEmail} 登入。`)
        setDataStatus('等待登入')
        return
      }
      setUser(session?.user ?? null)
      setAuthMessage('')
      setDataStatus(session?.user ? '同步中...' : '等待登入')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return

    let mounted = true

    loadCraftData()
      .then((data) => {
        if (!mounted) return
        setYarns(data.yarns)
        setPatterns(data.patterns)
        setProjects(data.projects)
        setSelectedYarnId(data.yarns[0]?.id ?? null)
        setSelectedPatternId(data.patterns[0]?.id ?? null)
        setSelectedProjectId(data.projects[0]?.id ?? null)
        setDataStatus('已連接 Supabase')
      })
      .catch((error) => {
        if (!mounted) return
        setDataStatus(`資料同步失敗：${error.message}`)
      })

    return () => {
      mounted = false
    }
  }, [user])

  const entityType =
    activeNav === 'patterns' || activeNav === 'projects' ? activeNav : 'yarns'
  const totalSkeins = yarns.reduce((sum, yarn) => sum + yarn.quantity, 0)
  const activeProjects = projects.filter((project) => project.status !== '完成')

  const materialFilters = useMemo(() => {
    const materials = new Set()
    yarns.forEach((yarn) => {
      extractMaterials(yarn.material).forEach((material) => materials.add(material))
    })
    return ['全部材質', ...Array.from(materials).sort((a, b) => a.localeCompare(b, 'zh-Hant'))]
  }, [yarns])

  const filteredYarns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return yarns.filter((yarn) => {
      const matchesQuery =
        !normalizedQuery ||
        [yarn.name, yarn.brand, yarn.color, yarn.material, yarn.notes]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      const matchesMaterial =
        materialFilter === '全部材質' || extractMaterials(yarn.material).includes(materialFilter)
      return matchesQuery && matchesMaterial
    })
  }, [materialFilter, query, yarns])

  const filteredPatterns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return patterns.filter((pattern) =>
      [pattern.name, pattern.category, pattern.sourceType, pattern.source]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [patterns, query])

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return projects.filter((project) =>
      [project.name, project.status, project.currentStep]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [projects, query])

  const selectedYarn = yarns.find((item) => item.id === selectedYarnId) ?? null
  const selectedPattern =
    patterns.find((item) => item.id === selectedPatternId) ?? null
  const selectedProject =
    projects.find((item) => item.id === selectedProjectId) ?? null

  function changeNav(id) {
    setActiveNav(id)
    setQuery('')
  }

  function openYarn(yarnId) {
    setSelectedYarnId(yarnId)
    setActiveNav('yarns')
    setQuery('')
  }

  function openPattern(patternId) {
    setSelectedPatternId(patternId)
    setActiveNav('patterns')
    setQuery('')
  }

  function updateListWidthFromClientX(clientX) {
    const sidebarWidth = 220
    const pagePadding = 28
    const nextWidth = Math.round(clientX - sidebarWidth - pagePadding)
    setListWidth(Math.min(720, Math.max(260, nextWidth)))
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    if (!supabase) return

    setAuthMessage('處理中...')
    const credentials = { email: authEmail, password: authPassword }
    if (!isAllowedEmail(authEmail)) {
      setAuthMessage(`此網站只允許 ${allowedEmail} 登入。`)
      return
    }

    const { error } = await supabase.auth.signInWithPassword(credentials)

    if (error) {
      setAuthMessage(error.message)
      return
    }

    setAuthMessage('已登入。')
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setYarns(seedYarns)
    setPatterns(seedPatterns)
    setProjects(seedProjects)
    setSelectedYarnId(seedYarns[0].id)
    setSelectedPatternId(seedPatterns[0].id)
    setSelectedProjectId(seedProjects[0].id)
    setDataStatus('等待登入')
  }

  async function deleteYarn(yarnId) {
    if (isSupabaseConfigured && user) {
      try {
        await deleteYarnById(yarnId)
        setDataStatus('已刪除線材')
      } catch (error) {
        setDataStatus(`刪除失敗：${error.message}`)
        return
      }
    }
    setYarns((current) => current.filter((yarn) => yarn.id !== yarnId))
    setPatterns((current) =>
      current.map((pattern) => ({
        ...pattern,
        yarnUsage: pattern.yarnUsage.filter((usage) => usage.yarnId !== yarnId),
      })),
    )
    setSelectedYarnId((current) => (current === yarnId ? null : current))
  }

  async function deletePattern(patternId) {
    if (isSupabaseConfigured && user) {
      try {
        await deletePatternById(patternId)
        setDataStatus('已刪除織圖')
      } catch (error) {
        setDataStatus(`刪除失敗：${error.message}`)
        return
      }
    }
    setPatterns((current) => current.filter((pattern) => pattern.id !== patternId))
    setYarns((current) =>
      current.map((yarn) => ({
        ...yarn,
        linkedPatternIds: yarn.linkedPatternIds.filter((id) => id !== patternId),
      })),
    )
    setProjects((current) =>
      current.map((project) =>
        project.patternId === patternId ? { ...project, patternId: null } : project,
      ),
    )
    setSelectedPatternId((current) => (current === patternId ? null : current))
  }

  async function deleteProject(projectId) {
    if (isSupabaseConfigured && user) {
      try {
        await deleteProjectById(projectId)
        setDataStatus('已刪除專案')
      } catch (error) {
        setDataStatus(`刪除失敗：${error.message}`)
        return
      }
    }
    setProjects((current) => current.filter((project) => project.id !== projectId))
    setSelectedProjectId((current) => (current === projectId ? null : current))
  }

  async function addEntity(values) {
    try {
      if (modalType === 'patterns') {
        const patternId = isSupabaseConfigured && user ? crypto.randomUUID() : `pattern-${Date.now()}`
        const uploadedImage =
          isSupabaseConfigured && user && values.imageFile
            ? await uploadCraftImage(values.imageFile, user.id, 'patterns', patternId)
            : null
        const pattern = {
          id: patternId,
          name: values.name || '未命名織圖',
          category: values.category || '未分類',
          sourceType: 'photo',
          source: values.source || '本機匯入',
          image: uploadedImage?.path ?? values.image ?? fallbackImage(values.name || 'Pattern', '#b96867'),
          yarnUsage: [],
        }
        const savedPattern =
          isSupabaseConfigured && user ? await createPattern(pattern, user.id) : pattern
        if (uploadedImage) savedPattern.image = uploadedImage.url
        setPatterns((current) => [savedPattern, ...current])
        setSelectedPatternId(savedPattern.id)
        setActiveNav('patterns')
      } else if (modalType === 'projects') {
        const projectId = isSupabaseConfigured && user ? crypto.randomUUID() : `project-${Date.now()}`
        const uploadedImage =
          isSupabaseConfigured && user && values.imageFile
            ? await uploadCraftImage(values.imageFile, user.id, 'projects', projectId)
            : null
        const project = {
          id: projectId,
          name: values.name || '未命名專案',
          patternId: values.patternId || patterns[0]?.id,
          status: values.status || '進行中',
          progress: Number(values.progress) || 0,
          currentStep: values.currentStep || '尚未新增進度',
          image: uploadedImage?.path ?? values.image ?? fallbackImage(values.name || 'Project', '#517493'),
          notes: values.notes || '',
        }
        const savedProject =
          isSupabaseConfigured && user ? await createProject(project, user.id) : project
        if (uploadedImage) savedProject.image = uploadedImage.url
        setProjects((current) => [savedProject, ...current])
        setSelectedProjectId(savedProject.id)
        setActiveNav('projects')
      } else {
        const yarnId = isSupabaseConfigured && user ? crypto.randomUUID() : `yarn-${Date.now()}`
        const uploadedImage =
          isSupabaseConfigured && user && values.imageFile
            ? await uploadCraftImage(values.imageFile, user.id, 'yarns', yarnId)
            : null
        const yarn = {
          id: yarnId,
          name: values.name || '未命名線材',
          brand: values.brand || '未分類',
          color: values.color || '未設定',
          colorHex: values.colorHex || '#8aa694',
          material: values.material || '未設定',
          weight: values.weight || '未設定',
          yardage: values.yardage || '未設定',
          quantity: Number(values.quantity) || 1,
          price: values.price || '未設定',
          purchasePlace: values.purchasePlace || '未設定',
          notes: values.notes || '尚未新增備註。',
          storage: values.storage || '未設定',
          image: uploadedImage?.path ?? values.image ?? fallbackImage(values.name || 'Yarn', values.colorHex),
          linkedPatternIds: [],
        }
        const savedYarn =
          isSupabaseConfigured && user ? await createYarn(yarn, user.id) : yarn
        if (uploadedImage) savedYarn.image = uploadedImage.url
        setYarns((current) => [savedYarn, ...current])
        setSelectedYarnId(savedYarn.id)
        setActiveNav('yarns')
      }
      setDataStatus(isSupabaseConfigured && user ? '已同步新增資料' : dataStatus)
      setModalType(null)
    } catch (error) {
      setDataStatus(`新增失敗：${error.message}`)
    }
  }

  async function importPhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const imageFile = await compressImageFile(file)
    const image = await blobToDataUrl(imageFile)

    if (entityType === 'patterns') {
      if (!selectedPatternId) return
      const uploadedImage =
        isSupabaseConfigured && user
          ? await uploadCraftImage(imageFile, user.id, 'patterns', selectedPatternId)
          : null
      const nextImage =
        uploadedImage && user ? await updatePatternImage(selectedPatternId, uploadedImage.path) : image
      setPatterns((current) =>
        current.map((pattern) =>
          pattern.id === selectedPatternId ? { ...pattern, image: nextImage } : pattern,
        ),
      )
    } else if (entityType === 'projects') {
      if (!selectedProjectId) return
      const uploadedImage =
        isSupabaseConfigured && user
          ? await uploadCraftImage(imageFile, user.id, 'projects', selectedProjectId)
          : null
      const nextImage =
        uploadedImage && user ? await updateProjectImage(selectedProjectId, uploadedImage.path) : image
      setProjects((current) =>
        current.map((project) =>
          project.id === selectedProjectId ? { ...project, image: nextImage } : project,
        ),
      )
    } else {
      if (!selectedYarnId) return
      const uploadedImage =
        isSupabaseConfigured && user
          ? await uploadCraftImage(imageFile, user.id, 'yarns', selectedYarnId)
          : null
      const nextImage =
        uploadedImage && user ? await updateYarnImage(selectedYarnId, uploadedImage.path) : image
      setYarns((current) =>
        current.map((yarn) =>
          yarn.id === selectedYarnId ? { ...yarn, image: nextImage } : yarn,
        ),
      )
    }
    setDataStatus(isSupabaseConfigured && user ? '照片已同步' : dataStatus)
    event.target.value = ''
  }

  if (isSupabaseConfigured && !user) {
    return (
      <AuthPage
        authEmail={authEmail}
        authMessage={authMessage}
        authPassword={authPassword}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onSubmit={handleAuthSubmit}
      />
    )
  }

  if (shouldBlockUnconfiguredProduction) {
    return <MissingConfigPage />
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主選單">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Palette size={22} />
          </div>
          <div>
            <strong>毛毛庫</strong>
            <span>線材、織圖、專案</span>
          </div>
        </div>

        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                className={activeNav === item.id ? 'nav-item active' : 'nav-item'}
                key={item.id}
                onClick={() => changeNav(item.id)}
                type="button"
              >
                <Icon size={21} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <label className="search">
            <Search size={20} />
            <input
              aria-label="搜尋"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                activeNav === 'overview'
                  ? '搜尋線材、織圖或專案'
                  : entityCopy[entityType].search
              }
              value={query}
            />
          </label>

          <button
            className="primary-button"
            onClick={() => setModalType(entityType)}
            type="button"
          >
            <Plus size={19} />
            {entityCopy[entityType].add}
          </button>
          <div className="connection-status">
            {user && (
              <button className="text-button" onClick={signOut} type="button">
                登出
              </button>
            )}
          </div>
        </header>

        {activeNav === 'overview' && (
          <OverviewPage
            onOpen={changeNav}
            patternCount={patterns.length}
            projectCount={activeProjects.length}
            totalSkeins={totalSkeins}
          />
        )}

        {activeNav === 'yarns' && (
          <EntityPage
            count={filteredYarns.length}
            extraToolbar={
              <>
                <SegmentedControl value={viewMode} onChange={setViewMode} />
                <SelectLike
                  label={materialFilter}
                  options={materialFilters}
                  onChange={setMaterialFilter}
                />
              </>
            }
            onImportClick={() => importInputRef.current?.click()}
            title="線材"
            unit="種"
          >
            <YarnsView
              onOpenPattern={openPattern}
              onCloseDetail={() => setSelectedYarnId(null)}
              onDeleteYarn={deleteYarn}
              onResizeStart={updateListWidthFromClientX}
              listWidth={listWidth}
              patterns={patterns}
              projects={projects}
              selectedYarn={selectedYarn}
              selectedYarnId={selectedYarnId}
              setSelectedYarnId={setSelectedYarnId}
              viewMode={viewMode}
              yarns={filteredYarns}
            />
          </EntityPage>
        )}

        {activeNav === 'patterns' && (
          <EntityPage
            count={filteredPatterns.length}
            onImportClick={() => importInputRef.current?.click()}
            title="織圖"
            unit="個"
          >
            <PatternsView
              onOpenYarn={openYarn}
              onPreviewImage={(image, title) => setLightboxImage({ image, title })}
              onCloseDetail={() => setSelectedPatternId(null)}
              onDeletePattern={deletePattern}
              onResizeStart={updateListWidthFromClientX}
              listWidth={listWidth}
              patterns={filteredPatterns}
              selectedPattern={selectedPattern}
              selectedPatternId={selectedPatternId}
              setSelectedPatternId={setSelectedPatternId}
              yarns={yarns}
            />
          </EntityPage>
        )}

        {activeNav === 'projects' && (
          <EntityPage
            count={filteredProjects.length}
            onImportClick={() => importInputRef.current?.click()}
            title="專案"
            unit="個"
          >
            <ProjectsView
              patterns={patterns}
              projects={filteredProjects}
              onCloseDetail={() => setSelectedProjectId(null)}
              onDeleteProject={deleteProject}
              onResizeStart={updateListWidthFromClientX}
              listWidth={listWidth}
              selectedProject={selectedProject}
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
            />
          </EntityPage>
        )}

        {activeNav === 'settings' && (
          <section className="simple-page">
            <h1>設定</h1>
            <p>{dataStatus}</p>
          </section>
        )}

        <input
          accept="image/*"
          className="visually-hidden"
          onChange={importPhoto}
          ref={importInputRef}
          type="file"
        />
      </main>

      {modalType && (
        <EntityModal
          onClose={() => setModalType(null)}
          onSubmit={addEntity}
          patterns={patterns}
          type={modalType}
        />
      )}

      {lightboxImage && (
        <ImageLightbox
          image={lightboxImage.image}
          onClose={() => setLightboxImage(null)}
          title={lightboxImage.title}
        />
      )}
    </div>
  )
}

function MissingConfigPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-mark" aria-hidden="true">
            <Palette size={22} />
          </div>
          <div>
            <strong>毛線管理系統</strong>
            <span>部署設定未完成</span>
          </div>
        </div>
        <div>
          <h1>缺少 Supabase 設定</h1>
          <p>
            正式部署需要設定 Vercel 環境變數：VITE_SUPABASE_URL、
            VITE_SUPABASE_PUBLISHABLE_KEY、VITE_ALLOWED_EMAIL。
          </p>
        </div>
      </section>
    </main>
  )
}

function AuthPage({
  authEmail,
  authMessage,
  authPassword,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="brand auth-brand">
          <div className="brand-mark" aria-hidden="true">
            <Palette size={22} />
          </div>
          <div>
            <strong>毛線管理系統</strong>
            <span>連接 Supabase 資料庫</span>
          </div>
        </div>
        <div>
          <h1>登入</h1>
        </div>
        <Field label="Email" type="email" value={authEmail} onChange={onEmailChange} />
        <Field
          label="密碼"
          type="password"
          value={authPassword}
          onChange={onPasswordChange}
        />
        {authMessage && <p className="auth-message">{authMessage}</p>}
        <button className="primary-button" type="submit">
          登入
        </button>
      </form>
    </main>
  )
}

function OverviewPage({
  onOpen,
  patternCount,
  projectCount,
  totalSkeins,
}) {
  const stats = [
    { id: 'yarns', icon: Palette, label: '線材', value: totalSkeins, unit: '個' },
    { id: 'patterns', icon: BookOpen, label: '織圖', value: patternCount, unit: '個' },
    { id: 'projects', icon: Gauge, label: '進行中專案', value: projectCount, unit: '個' },
  ]

  return (
    <section className="overview-page">
      <div className="page-title">
        <h1>總覽</h1>
      </div>
      <div className="stats-row">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <button
              className="stat-card clickable"
              key={stat.id}
              onClick={() => onOpen(stat.id)}
              type="button"
            >
              <div className="stat-icon sage">
                <Icon size={24} />
              </div>
              <div>
                <span>{stat.label}</span>
                <strong>
                  {stat.value}
                  <small>{stat.unit}</small>
                </strong>
              </div>
            </button>
          )
        })}
      </div>

    </section>
  )
}

function EntityPage({
  children,
  count,
  extraToolbar,
  onImportClick,
  title,
  unit,
}) {
  return (
    <section className="entity-page">
      <div className="section-heading">
        <div>
          <h1>{title}</h1>
          <span>
            共 {count} {unit}
          </span>
        </div>
        <div className="toolbar">
          {extraToolbar}
          <button className="ghost-button" onClick={onImportClick} type="button">
            <Upload size={17} />
            匯入照片
          </button>
        </div>
      </div>
      {children}
    </section>
  )
}

function YarnsView({
  onOpenPattern,
  onCloseDetail,
  onDeleteYarn,
  onResizeStart,
  listWidth,
  patterns,
  projects,
  selectedYarn,
  selectedYarnId,
  setSelectedYarnId,
  viewMode,
  yarns,
}) {
  const linkedPatterns = patterns.filter((pattern) =>
    selectedYarn?.linkedPatternIds.includes(pattern.id),
  )
  const plannedProjects = projects.filter((project) =>
    linkedPatterns.some((pattern) => pattern.id === project.patternId),
  )

  return (
    <div
      className={selectedYarn ? 'master-detail' : 'master-detail no-detail'}
      style={{ '--list-width': `${listWidth}px` }}
    >
      <div className="catalog-list">
        {viewMode === 'list' ? (
          <YarnTable
            patterns={patterns}
            selectedYarnId={selectedYarnId}
            setSelectedYarnId={setSelectedYarnId}
            yarns={yarns}
          />
        ) : (
          <YarnGrid
            selectedYarnId={selectedYarnId}
            setSelectedYarnId={setSelectedYarnId}
            yarns={yarns}
          />
        )}
      </div>
      {selectedYarn && <ResizeHandle onResize={onResizeStart} />}
      <YarnDetail
        linkedPatterns={linkedPatterns}
        onOpenPattern={onOpenPattern}
        onClose={onCloseDetail}
        onDelete={() => onDeleteYarn(selectedYarn.id)}
        plannedProjects={plannedProjects}
        selectedYarn={selectedYarn}
      />
    </div>
  )
}

function PatternsView({
  onOpenYarn,
  onPreviewImage,
  onCloseDetail,
  onDeletePattern,
  onResizeStart,
  listWidth,
  patterns,
  selectedPattern,
  selectedPatternId,
  setSelectedPatternId,
  yarns,
}) {
  return (
    <div
      className={selectedPattern ? 'master-detail' : 'master-detail no-detail'}
      style={{ '--list-width': `${listWidth}px` }}
    >
      <div className="catalog-list card-list">
        {patterns.map((pattern) => (
          <button
            className={selectedPatternId === pattern.id ? 'entity-card active' : 'entity-card'}
            key={pattern.id}
            onClick={() => setSelectedPatternId(pattern.id)}
            type="button"
          >
            <img alt="" src={pattern.image} />
            <div>
              <strong>{pattern.name}</strong>
              <span>{pattern.category}</span>
            </div>
            <FileText size={18} />
          </button>
        ))}
      </div>
      {selectedPattern && <ResizeHandle onResize={onResizeStart} />}
      <PatternDetail
        onOpenYarn={onOpenYarn}
        onClose={onCloseDetail}
        onDelete={() => onDeletePattern(selectedPattern.id)}
        onPreviewImage={onPreviewImage}
        pattern={selectedPattern}
        yarns={yarns}
      />
    </div>
  )
}

function ProjectsView({
  onCloseDetail,
  onDeleteProject,
  onResizeStart,
  listWidth,
  patterns,
  projects,
  selectedProject,
  selectedProjectId,
  setSelectedProjectId,
}) {
  return (
    <div
      className={selectedProject ? 'master-detail' : 'master-detail no-detail'}
      style={{ '--list-width': `${listWidth}px` }}
    >
      <div className="catalog-list project-card-list">
        <ProjectCards
          onSelect={setSelectedProjectId}
          projects={projects}
          selectedProjectId={selectedProjectId}
        />
      </div>
      {selectedProject && <ResizeHandle onResize={onResizeStart} />}
      <ProjectDetail
        onClose={onCloseDetail}
        onDelete={() => onDeleteProject(selectedProject.id)}
        patterns={patterns}
        project={selectedProject}
      />
    </div>
  )
}

function ResizeHandle({ onResize }) {
  function startDrag(event) {
    event.preventDefault()
    onResize(event.clientX)

    function move(moveEvent) {
      onResize(moveEvent.clientX)
    }

    function stop() {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  return (
    <button
      aria-label="拖曳調整清單寬度"
      className="resize-handle"
      onPointerDown={startDrag}
      type="button"
    />
  )
}

function YarnTable({ patterns, selectedYarnId, setSelectedYarnId, yarns }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>名稱</th>
            <th>顏色</th>
            <th>材質</th>
            <th>重量</th>
            <th>數量</th>
            <th>連結織圖</th>
          </tr>
        </thead>
        <tbody>
          {yarns.map((yarn) => (
            <tr
              className={selectedYarnId === yarn.id ? 'selected-row' : ''}
              key={yarn.id}
              onClick={() => setSelectedYarnId(yarn.id)}
            >
              <td>
                <div className="name-cell">
                  <img alt="" src={yarn.image} />
                  <div>
                    <strong>{yarn.name}</strong>
                    <span>{yarn.brand}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className="color-cell">
                  <i style={{ background: yarn.colorHex }} />
                  {yarn.color}
                </span>
              </td>
              <td>{yarn.material}</td>
              <td>{yarn.weight}</td>
              <td>{yarn.quantity}</td>
              <td>
                {patterns.filter((pattern) => yarn.linkedPatternIds.includes(pattern.id)).length} 個
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function YarnGrid({ selectedYarnId, setSelectedYarnId, yarns }) {
  return (
    <div className="yarn-grid">
      {yarns.map((yarn) => (
        <button
          className={selectedYarnId === yarn.id ? 'yarn-card active' : 'yarn-card'}
          key={yarn.id}
          onClick={() => setSelectedYarnId(yarn.id)}
          type="button"
        >
          <img alt="" src={yarn.image} />
          <strong>{yarn.name}</strong>
          <span>
            {yarn.color} / {yarn.quantity} 線
          </span>
        </button>
      ))}
    </div>
  )
}

function ProjectCards({ onSelect, projects, selectedProjectId }) {
  return (
    <div className="project-rail">
      {projects.map((project) => (
        <button
          className={selectedProjectId === project.id ? 'project-card active' : 'project-card'}
          key={project.id}
          onClick={onSelect ? () => onSelect(project.id) : undefined}
          type="button"
        >
          <img alt="" src={project.image} />
          <div>
            <strong>{project.name}</strong>
            <span>{project.progress}%</span>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${project.progress}%` }} />
          </div>
          <p>{project.currentStep}</p>
          <em>{project.status}</em>
        </button>
      ))}
    </div>
  )
}

function YarnDetail({
  linkedPatterns,
  onClose,
  onDelete,
  onOpenPattern,
  plannedProjects,
  selectedYarn,
}) {
  if (!selectedYarn) return null

  return (
    <aside className="entity-detail" aria-label="線材詳細資料">
      <DetailHeader
        kicker={selectedYarn.brand}
        onClose={onClose}
        onDelete={onDelete}
        title={selectedYarn.name}
      />
      <img className="detail-photo" alt="" src={selectedYarn.image} />
      <dl className="facts">
        <Fact label="顏色">
          <i style={{ background: selectedYarn.colorHex }} />
          {selectedYarn.color}
        </Fact>
        <Fact label="材質">{selectedYarn.material}</Fact>
        <Fact label="重量">
          {selectedYarn.weight}（{selectedYarn.yardage}）
        </Fact>
        <Fact label="數量">{selectedYarn.quantity} 線</Fact>
        <Fact label="價格">{selectedYarn.price ?? '未設定'}</Fact>
        <Fact label="購買地點">{selectedYarn.purchasePlace ?? '未設定'}</Fact>
        <Fact label="存放位置">{selectedYarn.storage}</Fact>
      </dl>
      <div className="note-box">{selectedYarn.notes}</div>
      <LinkedList
        title={`連結織圖（${linkedPatterns.length}）`}
        items={linkedPatterns}
        onItemClick={(pattern) => onOpenPattern(pattern.id)}
      />
      <LinkedList
        title="預計使用專案"
        items={plannedProjects}
        meta={(project) => `目前進度 ${project.progress}%`}
      />
    </aside>
  )
}

function PatternDetail({ onClose, onDelete, onOpenYarn, onPreviewImage, pattern, yarns }) {
  if (!pattern) return null
  const usedYarns = pattern.yarnUsage
    .map((usage) => ({
      ...usage,
      yarn: yarns.find((yarn) => yarn.id === usage.yarnId),
    }))
    .filter((usage) => usage.yarn)

  return (
    <aside className="entity-detail" aria-label="織圖詳細資料">
      <DetailHeader
        kicker={pattern.category}
        onClose={onClose}
        onDelete={onDelete}
        title={pattern.name}
      />
      <button
        className="detail-photo-button"
        onClick={() => onPreviewImage(pattern.image, pattern.name)}
        type="button"
      >
        <img className="detail-photo" alt="" src={pattern.image} />
      </button>
      <dl className="facts">
        <Fact label="類別">{pattern.category}</Fact>
        <Fact label="來源">{pattern.sourceType}</Fact>
        <Fact label="檔案/網站">{pattern.source}</Fact>
      </dl>
      <section className="linked-section">
        <div className="subheading">
          <h3>使用線材</h3>
        </div>
        <div className="linked-list">
          {usedYarns.map((usage) => (
            <button
              className="linked-row-button"
              key={usage.yarnId}
              onClick={() => onOpenYarn(usage.yarnId)}
              type="button"
            >
              <img alt="" src={usage.yarn.image} />
              <div>
                <strong>{usage.yarn.name}</strong>
                <span>{usage.amount}</span>
              </div>
              <MoreHorizontal size={17} />
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}

function ProjectDetail({ onClose, onDelete, patterns, project }) {
  if (!project) return null
  const pattern = patterns.find((item) => item.id === project.patternId)

  return (
    <aside className="entity-detail" aria-label="專案詳細資料">
      <DetailHeader
        kicker={project.status}
        onClose={onClose}
        onDelete={onDelete}
        title={project.name}
      />
      <img className="detail-photo" alt="" src={project.image} />
      <dl className="facts">
        <Fact label="進度">{project.progress}%</Fact>
        <Fact label="目前進度">{project.currentStep}</Fact>
        <Fact label="織圖">{pattern?.name ?? '尚未連結'}</Fact>
        <Fact label="類別">{pattern?.category ?? '未分類'}</Fact>
      </dl>
      <div className="detail-progress">
        <div className="progress-bar">
          <span style={{ width: `${project.progress}%` }} />
        </div>
      </div>
    </aside>
  )
}

function LinkedList({ items, meta, onItemClick, title }) {
  return (
    <section className="linked-section">
      <div className="subheading">
        <h3>{title}</h3>
      </div>
      <div className="linked-list">
        {items.map((item) => {
          const content = (
            <>
              <img alt="" src={item.image} />
              <div>
                <strong>{item.name}</strong>
                <span>{meta ? meta(item) : item.category}</span>
              </div>
              <MoreHorizontal size={17} />
            </>
          )

          return onItemClick ? (
            <button
              className="linked-row-button"
              key={item.id}
              onClick={() => onItemClick(item)}
              type="button"
            >
              {content}
            </button>
          ) : (
            <article key={item.id}>{content}</article>
          )
        })}
      </div>
    </section>
  )
}

function ImageLightbox({ image, onClose, title }) {
  return (
    <div className="lightbox-backdrop" role="presentation" onClick={onClose}>
      <div className="lightbox" role="dialog" aria-label={`${title} 放大圖片`}>
        <button className="lightbox-close" onClick={onClose} title="關閉" type="button">
          <X size={20} />
        </button>
        <img alt="" src={image} />
        <strong>{title}</strong>
      </div>
    </div>
  )
}

function DetailHeader({ kicker, onClose, onDelete, title }) {
  return (
    <div className="detail-header">
      <div>
        <h2>{title}</h2>
        <span>{kicker}</span>
      </div>
      <div className="detail-actions">
        <button className="detail-delete" onClick={onDelete} title="刪除" type="button">
          <Trash2 size={18} />
        </button>
        <button className="detail-close" onClick={onClose} title="關閉子頁面" type="button">
          <X size={20} />
        </button>
      </div>
    </div>
  )
}

function Fact({ children, label }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function SegmentedControl({ value, onChange }) {
  return (
    <div className="segmented" aria-label="顯示模式">
      <button
        aria-pressed={value === 'grid'}
        onClick={() => onChange('grid')}
        title="卡片檢視"
        type="button"
      >
        <Grid2X2 size={18} />
      </button>
      <button
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
        title="清單檢視"
        type="button"
      >
        <List size={18} />
      </button>
    </div>
  )
}

function SelectLike({ label, options, onChange }) {
  return (
    <label className="select-like">
      <select
        aria-label="材質篩選"
        onChange={(event) => onChange(event.target.value)}
        value={label}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function EntityModal({ onClose, onSubmit, patterns, type }) {
  const [form, setForm] = useState({
    colorHex: '#c78f8f',
    image: '',
    quantity: 1,
    progress: 0,
    sourceType: 'photo',
    status: '進行中',
  })
  const title = entityCopy[type]?.add ?? '新增項目'

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const imageFile = await compressImageFile(file)
    const image = await blobToDataUrl(imageFile)
    setForm((current) => ({ ...current, image, imageFile }))
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <span>可直接上傳照片，不需要輸入圖片 URL。</span>
          </div>
          <button onClick={onClose} title="關閉" type="button">
            <X size={20} />
          </button>
        </div>

        <label className="photo-picker">
          <input accept="image/*" onChange={handleFile} type="file" />
          {form.image ? <img alt="" src={form.image} /> : <ImagePlus size={32} />}
          <span>{form.image ? '更換照片' : '新增照片'}</span>
        </label>

        <div className="form-grid">
          <Field label="名稱" value={form.name ?? ''} onChange={(value) => updateField('name', value)} />
          {type === 'yarns' && (
            <>
              <Field label="品牌" value={form.brand ?? ''} onChange={(value) => updateField('brand', value)} />
              <Field label="顏色" value={form.color ?? ''} onChange={(value) => updateField('color', value)} />
              <label className="field">
                <span>色票</span>
                <input
                  onChange={(event) => updateField('colorHex', event.target.value)}
                  type="color"
                  value={form.colorHex}
                />
              </label>
              <Field label="材質" value={form.material ?? ''} onChange={(value) => updateField('material', value)} />
              <Field label="重量" value={form.weight ?? ''} onChange={(value) => updateField('weight', value)} />
              <Field label="長度" value={form.yardage ?? ''} onChange={(value) => updateField('yardage', value)} />
              <Field label="數量" type="number" value={form.quantity} onChange={(value) => updateField('quantity', value)} />
              <Field label="價格" value={form.price ?? ''} onChange={(value) => updateField('price', value)} />
              <Field label="購買地點" value={form.purchasePlace ?? ''} onChange={(value) => updateField('purchasePlace', value)} />
              <Field label="存放位置" value={form.storage ?? ''} onChange={(value) => updateField('storage', value)} />
            </>
          )}
          {type === 'patterns' && (
            <>
              <Field label="類別" value={form.category ?? ''} onChange={(value) => updateField('category', value)} />
              <Field label="來源" value={form.source ?? ''} onChange={(value) => updateField('source', value)} />
            </>
          )}
          {type === 'projects' && (
            <>
              <label className="field">
                <span>織圖</span>
                <select
                  onChange={(event) => updateField('patternId', event.target.value)}
                  value={form.patternId ?? patterns[0]?.id}
                >
                  {patterns.map((pattern) => (
                    <option key={pattern.id} value={pattern.id}>
                      {pattern.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="狀態" value={form.status} onChange={(value) => updateField('status', value)} />
              <Field label="進度" type="number" value={form.progress} onChange={(value) => updateField('progress', value)} />
              <Field label="目前進度" value={form.currentStep ?? ''} onChange={(value) => updateField('currentStep', value)} />
            </>
          )}
          <label className="field wide">
            <span>備註</span>
            <textarea value={form.notes ?? ''} onChange={(event) => updateField('notes', event.target.value)} />
          </label>
        </div>
        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose} type="button">
            取消
          </button>
          <button className="primary-button" type="submit">
            <PackagePlus size={18} />
            建立
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, onChange, type = 'text', value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input onChange={(event) => onChange(event.target.value)} type={type} value={value} />
    </label>
  )
}

export default App
