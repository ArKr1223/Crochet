export function readProjectYarns(value = '') {
  try {
    const parsed = JSON.parse(value)
    if (parsed?.type === 'project-yarns-v1' && Array.isArray(parsed.items)) {
      return {
        yarnLinks: parsed.items.filter((item) => typeof item?.id === 'string' && typeof item?.name === 'string'),
        yarnNote: typeof parsed.note === 'string' ? parsed.note : '',
      }
    }
  } catch { /* Existing projects contain plain text. */ }
  return { yarnLinks: [], yarnNote: value }
}

export function writeProjectYarns(project) {
  if (!project.yarnLinks) return project.yarnDescription || ''
  return JSON.stringify({ type: 'project-yarns-v1', items: project.yarnLinks, note: project.yarnNote || '' })
}

export function describeProjectYarns(links, note = '') {
  return [...links.map((item) => item.name), note].filter(Boolean).join('、')
}
