const svgData = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

const yarnImage = (primary, secondary, label) =>
  svgData(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="${secondary}" offset="0"/>
        <stop stop-color="#f8f6f0" offset="1"/>
      </linearGradient>
      <pattern id="stitch" width="36" height="36" patternUnits="userSpaceOnUse">
        <path d="M0 18h36M18 0v36" stroke="rgba(45,55,51,.12)" stroke-width="2"/>
      </pattern>
    </defs>
    <rect width="900" height="650" fill="url(#bg)"/>
    <rect width="900" height="650" fill="url(#stitch)" opacity=".7"/>
    <g transform="translate(450 330)">
      <circle r="178" fill="${primary}"/>
      <path d="M-154-52c85-72 222-70 304-3M-164 10c97-79 236-78 329 0M-150 74c83-61 207-63 299-7" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="30" stroke-linecap="round"/>
      <path d="M-116-130c94 88 173 188 230 300M-28-166c40 111 76 222 108 332M70-151C8-42-55 64-112 164" fill="none" stroke="rgba(80,60,58,.22)" stroke-width="17" stroke-linecap="round"/>
    </g>
    <rect x="316" y="482" width="268" height="86" rx="8" fill="rgba(255,255,255,.82)" stroke="rgba(60,60,60,.1)"/>
    <text x="450" y="526" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#293331">${label}</text>
  </svg>`)

const projectImage = (primary, secondary, label) =>
  svgData(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#ffffff" offset="0"/>
        <stop stop-color="${secondary}" offset="1"/>
      </linearGradient>
    </defs>
    <rect width="900" height="650" fill="url(#bg)"/>
    <path d="M0 510c160-80 282-83 430-18 149 66 296 65 470-17v175H0z" fill="${primary}" opacity=".22"/>
    <g transform="translate(190 150)" fill="none" stroke="${primary}" stroke-linecap="round" stroke-width="22">
      <path d="M0 0c86 72 166 72 240 0s154-72 240 0"/>
      <path d="M0 78c86 72 166 72 240 0s154-72 240 0"/>
      <path d="M0 156c86 72 166 72 240 0s154-72 240 0"/>
    </g>
    <rect x="132" y="430" width="636" height="112" rx="10" fill="rgba(255,255,255,.78)" stroke="rgba(50,60,55,.1)"/>
    <text x="450" y="498" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#293331">${label}</text>
  </svg>`)

export const yarns = [
  {
    id: 'yarn-1',
    name: 'Drops Merino Extra Fine',
    brand: 'Drops',
    color: '乾燥玫瑰',
    colorHex: '#d99a9a',
    material: '100% 美麗諾羊毛',
    weight: '50g',
    yardage: '約 105m',
    quantity: 6,
    price: 'NT$ 180 / 線',
    purchasePlace: '毛線森林',
    notes: '手感柔軟，適合貼身衣物。顏色溫柔，實品比照片再偏粉一些。',
    storage: '毛線森林',
    image: yarnImage('#d99a9a', '#f3dfdd', 'Merino'),
    linkedPatternIds: ['pattern-1', 'pattern-2', 'pattern-3'],
  },
  {
    id: 'yarn-2',
    name: 'Katia Concept Alpaca Silver',
    brand: 'Katia',
    color: '淺灰',
    colorHex: '#c9c7c0',
    material: '羊駝毛、尼龍',
    weight: '25g',
    yardage: '約 120m',
    quantity: 4,
    price: 'NT$ 260 / 線',
    purchasePlace: 'Katia 官方通路',
    notes: '有細緻光澤，適合披肩或輕薄罩衫。',
    storage: '透明收納盒 A',
    image: yarnImage('#c9c7c0', '#ece9e2', 'Alpaca'),
    linkedPatternIds: ['pattern-2', 'pattern-4'],
  },
  {
    id: 'yarn-3',
    name: 'Holst Garn Supersoft',
    brand: 'Holst Garn',
    color: '鼠尾草綠',
    colorHex: '#8a9783',
    material: '100% 羊毛',
    weight: '50g',
    yardage: '約 287m',
    quantity: 3,
    price: 'NT$ 210 / 線',
    purchasePlace: '網路毛線店',
    notes: '洗後會膨鬆，適合做結構感包款。',
    storage: '抽屜 2',
    image: yarnImage('#8a9783', '#e1e8dd', 'Supersoft'),
    linkedPatternIds: ['pattern-3'],
  },
  {
    id: 'yarn-4',
    name: 'DMC Natura Just Cotton',
    brand: 'DMC',
    color: '米白',
    colorHex: '#e8dcc9',
    material: '100% 棉',
    weight: '50g',
    yardage: '約 155m',
    quantity: 8,
    price: 'NT$ 120 / 線',
    purchasePlace: '手作材料行',
    notes: '線股清楚，適合杯墊、袋身與夏季小物。',
    storage: '棉線區',
    image: yarnImage('#e8dcc9', '#f4eee2', 'Cotton'),
    linkedPatternIds: ['pattern-1', 'pattern-3', 'pattern-5', 'pattern-6'],
  },
  {
    id: 'yarn-5',
    name: 'Hamanaka Soft Tweed',
    brand: 'Hamanaka',
    color: '燕麥色',
    colorHex: '#c0ad9b',
    material: '羊毛、尼龍、嫘縈',
    weight: '40g',
    yardage: '約 82m',
    quantity: 5,
    price: 'NT$ 230 / 線',
    purchasePlace: '日系線材店',
    notes: '帶細小彩點，成品很有秋冬感。',
    storage: '日系線材籃',
    image: yarnImage('#c0ad9b', '#eee4da', 'Tweed'),
    linkedPatternIds: ['pattern-4'],
  },
  {
    id: 'yarn-6',
    name: 'Scheepjes Stone Washed',
    brand: 'Scheepjes',
    color: '丹寧藍',
    colorHex: '#6380a4',
    material: '棉、壓克力',
    weight: '50g',
    yardage: '約 130m',
    quantity: 3,
    price: 'NT$ 160 / 線',
    purchasePlace: '海外代購',
    notes: '顏色有石洗層次，適合玩偶與帽子。',
    storage: '藍色系抽屜',
    image: yarnImage('#6380a4', '#dce8f2', 'Stone'),
    linkedPatternIds: ['pattern-5', 'pattern-6'],
  },
  {
    id: 'yarn-7',
    name: 'Rico Creative Cotton',
    brand: 'Rico Design',
    color: '奶茶',
    colorHex: '#c6b2a3',
    material: '100% 棉',
    weight: '50g',
    yardage: '約 85m',
    quantity: 2,
    price: 'NT$ 150 / 線',
    purchasePlace: 'Rico Design 經銷',
    notes: '偏硬挺，適合包底或家飾。',
    storage: '棉線區',
    image: yarnImage('#c6b2a3', '#eee2da', 'Rico'),
    linkedPatternIds: [],
  },
  {
    id: 'yarn-8',
    name: 'Ito Sensai',
    brand: 'Ito',
    color: '櫻花粉',
    colorHex: '#e7b7c2',
    material: '絲、馬海毛',
    weight: '20g',
    yardage: '約 240m',
    quantity: 4,
    price: 'NT$ 320 / 線',
    purchasePlace: 'ITO 線材專門店',
    notes: '可以併線增加毛茸感，留給披肩或細緻罩衫。',
    storage: '透明收納盒 B',
    image: yarnImage('#e7b7c2', '#f5e2e8', 'Sensai'),
    linkedPatternIds: ['pattern-1'],
  },
]

export const patterns = [
  {
    id: 'pattern-1',
    name: '春日花漾披肩',
    category: '披肩',
    sourceType: 'pdf',
    source: 'patterns/spring-shawl.pdf',
    image: projectImage('#d99a9a', '#f8e6e1', '春日披肩'),
    yarnUsage: [
      { yarnId: 'yarn-1', amount: '4 線' },
      { yarnId: 'yarn-8', amount: '1 線併線' },
    ],
  },
  {
    id: 'pattern-2',
    name: '雲朵針織毛衣',
    category: '毛衣',
    sourceType: 'website',
    source: 'https://example.com/cloud-cardigan',
    image: projectImage('#c9c7c0', '#ebe8df', '雲朵毛衣'),
    yarnUsage: [
      { yarnId: 'yarn-1', amount: '6 線' },
      { yarnId: 'yarn-2', amount: '2 線點綴' },
    ],
  },
  {
    id: 'pattern-3',
    name: '森林系手提包',
    category: '包包',
    sourceType: 'website',
    source: 'https://example.com/forest-bag',
    image: projectImage('#8a9783', '#e3eadf', '森林包'),
    yarnUsage: [
      { yarnId: 'yarn-3', amount: '2 線' },
      { yarnId: 'yarn-4', amount: '3 線' },
    ],
  },
  {
    id: 'pattern-4',
    name: '簡約麻花圍脖',
    category: '圍脖',
    sourceType: 'photo',
    source: '相簿 / winter-cowl',
    image: projectImage('#b99f85', '#efe4d7', '麻花圍脖'),
    yarnUsage: [
      { yarnId: 'yarn-2', amount: '2 線' },
      { yarnId: 'yarn-5', amount: '1 線' },
    ],
  },
  {
    id: 'pattern-5',
    name: '小熊玩偶',
    category: '玩偶',
    sourceType: 'pdf',
    source: 'patterns/teddy.pdf',
    image: projectImage('#6380a4', '#dde8f0', '小熊玩偶'),
    yarnUsage: [{ yarnId: 'yarn-6', amount: '2 線' }],
  },
  {
    id: 'pattern-6',
    name: '條紋毛帽',
    category: '帽子',
    sourceType: 'website',
    source: 'https://example.com/stripe-hat',
    image: projectImage('#cf8a96', '#f1dde3', '條紋毛帽'),
    yarnUsage: [
      { yarnId: 'yarn-4', amount: '1 線' },
      { yarnId: 'yarn-6', amount: '1 線' },
    ],
  },
]

export const projects = [
  {
    id: 'project-1',
    name: '雲朵針織毛衣',
    patternId: 'pattern-2',
    status: '進行中',
    progress: 50,
    currentStep: '已織 12 / 24 行',
    image: projectImage('#c9c7c0', '#ebe8df', '雲朵毛衣'),
  },
  {
    id: 'project-2',
    name: '春日花漾披肩',
    patternId: 'pattern-1',
    status: '進行中',
    progress: 30,
    currentStep: '已織 6 / 20 行',
    image: projectImage('#d99a9a', '#f8e6e1', '春日披肩'),
  },
  {
    id: 'project-3',
    name: '森林系手提包',
    patternId: 'pattern-3',
    status: '收尾',
    progress: 80,
    currentStep: '已完成主體，進行縫合',
    image: projectImage('#8a9783', '#e3eadf', '森林包'),
  },
  {
    id: 'project-4',
    name: '小熊玩偶',
    patternId: 'pattern-5',
    status: '進行中',
    progress: 20,
    currentStep: '已織 4 / 20 行',
    image: projectImage('#6380a4', '#dde8f0', '小熊玩偶'),
  },
  {
    id: 'project-5',
    name: '條紋毛帽',
    patternId: 'pattern-6',
    status: '進行中',
    progress: 65,
    currentStep: '帽身完成，進行收針',
    image: projectImage('#cf8a96', '#f1dde3', '條紋毛帽'),
  },
]
