export interface TableDemoRow {
  id: number
  name: string
  city: string
  owner: string
  status: string
  progress: number
  orders: number
  amount: number
  date: string
  remark: string
}

export const TABLE_DEMO_ROWS: TableDemoRow[] = [
  {
    id: 1,
    name: '按钮 Button',
    city: '上海',
    owner: '黄博',
    status: '稳定',
    progress: 100,
    orders: 128,
    amount: 18600,
    date: '2026-10-08',
    remark: '覆盖默认、主色、成功、警告、危险五种类型，支持朴素、文字与链接形态。'
  },
  {
    id: 2,
    name: '输入框 Input',
    city: '杭州',
    owner: '李雯',
    status: '稳定',
    progress: 100,
    orders: 96,
    amount: 12400,
    date: '2026-10-11',
    remark: '支持前后缀、清除、密码显隐与字数统计。'
  },
  {
    id: 3,
    name: '表格 Table',
    city: '成都',
    owner: '周子墨',
    status: '内测',
    progress: 82,
    orders: 72,
    amount: 32800,
    date: '2026-10-19',
    remark: '单表结构渲染，冻结列由纯 CSS sticky 实现，横向滚动不复制表格。'
  },
  {
    id: 4,
    name: '选择器 Select',
    city: '深圳',
    owner: '陈可',
    status: '稳定',
    progress: 100,
    orders: 143,
    amount: 15600,
    date: '2026-09-27',
    remark: '支持单选、多选、过滤与虚拟滚动。'
  },
  {
    id: 5,
    name: '日期选择 DatePicker',
    city: '北京',
    owner: '赵一鸣',
    status: '规划',
    progress: 35,
    orders: 18,
    amount: 4200,
    date: '2026-11-02',
    remark: '区间选择与快捷日期，面板定位复用 Popper。'
  },
  {
    id: 6,
    name: '树形控件 Tree',
    city: '武汉',
    owner: '孙悦',
    status: '内测',
    progress: 76,
    orders: 64,
    amount: 9800,
    date: '2026-10-23',
    remark: '异步加载、复选与拖拽排序。'
  },
  {
    id: 7,
    name: '标签页 Tabs',
    city: '南京',
    owner: '吴桐',
    status: '稳定',
    progress: 100,
    orders: 88,
    amount: 7600,
    date: '2026-10-02',
    remark: '可关闭、可编辑、懒加载面板。'
  },
  {
    id: 8,
    name: '抽屉 Drawer',
    city: '西安',
    owner: '郑凯',
    status: '稳定',
    progress: 100,
    orders: 51,
    amount: 6400,
    date: '2026-09-18',
    remark: '支持四个方向与嵌套层级。'
  },
  {
    id: 9,
    name: '对话框 Dialog',
    city: '苏州',
    owner: '林静',
    status: '规划',
    progress: 28,
    orders: 12,
    amount: 2800,
    date: '2026-11-04',
    remark: '拖拽与全屏模式待完善。'
  },
  {
    id: 10,
    name: '表单项 Form',
    city: '广州',
    owner: '何嘉',
    status: '内测',
    progress: 68,
    orders: 39,
    amount: 11200,
    date: '2026-10-16',
    remark: '校验规则与字段联动。'
  }
]

export const TABLE_LONG_ROWS: TableDemoRow[] = Array.from({ length: 24 }, (_value, index) => {
  const base = TABLE_DEMO_ROWS[index % TABLE_DEMO_ROWS.length]
  return {
    ...base,
    id: index + 1,
    orders: base.orders + index * 3,
    amount: base.amount + index * 1200,
    date: `2026-${String(9 + (index % 3)).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`
  }
})

export interface TableHeavyRow extends TableDemoRow {
  group: string
  desc: string
}

// 重数据示例用的确定性行生成器：字段全部由行号推导，同一条数永远生成同一行
// 函数体保持自包含（不引用模块级常量），demo 代码展示用 toString 整体还原
export function makeHeavyRows(count: number): TableHeavyRow[] {
  const cities = ['上海', '杭州', '成都', '深圳', '北京', '武汉', '南京', '西安', '苏州', '广州']
  const owners = ['黄博', '李雯', '周子墨', '陈可', '孙悦', '吴桐', '林静', '赵一鸣', '何嘉', '郑凯', '冯远', '许晴']
  const modules = ['按钮', '输入框', '选择器', '表格', '表单', '日期', '弹窗', '导航', '树形', '上传', '图表', '布局']
  const statuses = ['稳定', '内测', '规划']
  const descLines = [
    '基础链路验证通过，无阻塞问题。',
    '覆盖核心场景与边界输入，指标均在预期区间。',
    '关联需求已评审，遗留两项低风险项，跟进人明确。',
    '压测期间高峰 QPS 稳定，慢查询已建索引优化，后续观察一周即可归档。'
  ]
  return Array.from({ length: count }, (_value, index) => {
    const serial = index + 1
    const pseudo = (serial * 2654435761) % 100000
    return {
      id: serial,
      name: `${modules[index % modules.length]}模块-${String(serial).padStart(5, '0')}`,
      city: cities[index % cities.length],
      owner: owners[index % owners.length],
      status: statuses[index % statuses.length],
      progress: pseudo % 101,
      orders: (pseudo % 180) + 12,
      amount: ((pseudo % 420) + 40) * 900,
      date: `2026-${String((index % 4) + 9).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
      remark: `第 ${Math.floor(index / 50) + 1} 批第 ${(index % 50) + 1} 项，确定性生成的压测数据。`,
      desc: descLines.slice(0, (index % 4) + 1).join('\n'),
      group: `第 ${Math.floor(index / 50) + 1} 批`
    }
  })
}

// 树形虚拟滚动压测数据：三层结构（20 组 × 10 项 × 25 叶子）全展开 5220 行，
// desc 行数 5~50 行不等（行高约 100~1000px），全部由行号推导的确定性生成
export function makeHeavyTreeRows(): TableTreeRow[] {
  const cities = ['上海', '杭州', '成都', '深圳', '北京', '武汉', '南京', '西安', '苏州', '广州']
  const owners = ['黄博', '李雯', '周子墨', '陈可', '孙悦', '吴桐', '林静', '赵一鸣', '何嘉', '郑凯', '冯远', '许晴']
  const modules = ['按钮', '输入框', '选择器', '表格', '表单', '日期', '弹窗', '导航', '树形', '上传', '图表', '布局']
  const statuses = ['稳定', '内测', '规划']
  let serial = 0
  function makeRow(depth: number, label: string): TableTreeRow {
    serial += 1
    const pseudo = (serial * 2654435761) % 100000
    const lineCount = 4 + (pseudo % 45)
    const desc = Array.from(
      { length: lineCount },
      (_value, line) =>
        line === 0 ? `第 1 行：深度 ${depth} 的压测数据。` : `第 ${line + 1} 行：确定性树形压测数据。`
    ).join('\n')
    return {
      id: `heavy-tree-${serial}`,
      name: label,
      city: cities[serial % cities.length],
      owner: owners[serial % owners.length],
      status: statuses[serial % statuses.length],
      progress: pseudo % 101,
      amount: ((pseudo % 420) + 40) * 900,
      date: `2026-${String((serial % 4) + 9).padStart(2, '0')}-${String((serial % 27) + 1).padStart(2, '0')}`,
      desc
    }
  }
  return Array.from({ length: 20 }, (_root, rootIndex) => ({
    ...makeRow(0, `${modules[rootIndex % modules.length]}组-${String(rootIndex + 1).padStart(2, '0')}`),
    children: Array.from({ length: 10 }, (_child, childIndex) => ({
      ...makeRow(1, `子项-${rootIndex + 1}-${childIndex + 1}`),
      children: Array.from({ length: 25 }, (_leaf, leafIndex) =>
        makeRow(2, `叶子-${rootIndex + 1}-${childIndex + 1}-${leafIndex + 1}`)
      )
    }))
  }))
}

// 复杂大表（编辑 + 冻结 + 合计 + 合并）每个合并块的行数
export const HEAVY_GROUP_SIZE = 50

export interface TableTreeRow {
  id: string
  name: string
  city: string
  owner: string
  status: string
  progress: number
  amount: number
  date: string
  desc?: string
  children?: TableTreeRow[]
}

export const TABLE_TREE_ROWS: TableTreeRow[] = [
  {
    id: 'team-design',
    name: '设计组',
    city: '上海',
    owner: '黄博',
    status: '稳定',
    progress: 100,
    amount: 28600,
    date: '2026-10-18',
    children: [
      {
        id: 'team-ui',
        name: 'UI 规范',
        city: '上海',
        owner: '李雯',
        status: '稳定',
        progress: 100,
        amount: 12600,
        date: '2026-10-12'
      },
      {
        id: 'team-motion',
        name: '动效规范',
        city: '上海',
        owner: '陈可',
        status: '内测',
        progress: 78,
        amount: 9800,
        date: '2026-10-20'
      }
    ]
  },
  {
    id: 'team-eng',
    name: '研发组',
    city: '杭州',
    owner: '周子墨',
    status: '内测',
    progress: 82,
    amount: 52400,
    date: '2026-10-25',
    children: [
      {
        id: 'team-core',
        name: '组件库',
        city: '杭州',
        owner: '周子墨',
        status: '内测',
        progress: 86,
        amount: 38600,
        date: '2026-10-24',
        children: [
          {
            id: 'team-table',
            name: '表格重构',
            city: '杭州',
            owner: '孙悦',
            status: '内测',
            progress: 74,
            amount: 19800,
            date: '2026-10-26'
          },
          {
            id: 'team-form',
            name: '表单内核',
            city: '杭州',
            owner: '吴桐',
            status: '稳定',
            progress: 100,
            amount: 15200,
            date: '2026-09-30'
          }
        ]
      },
      {
        id: 'team-doc',
        name: '文档站',
        city: '杭州',
        owner: '林静',
        status: '规划',
        progress: 42,
        amount: 8600,
        date: '2026-11-03'
      }
    ]
  },
  {
    id: 'team-qa',
    name: '质量组',
    city: '成都',
    owner: '赵一鸣',
    status: '稳定',
    progress: 92,
    amount: 18600,
    date: '2026-10-21',
    children: [
      {
        id: 'team-check',
        name: '回归测试',
        city: '成都',
        owner: '何嘉',
        status: '稳定',
        progress: 94,
        amount: 12000,
        date: '2026-10-19'
      },
      {
        id: 'team-perf',
        name: '性能基线',
        city: '成都',
        owner: '郑凯',
        status: '内测',
        progress: 70,
        amount: 6600,
        date: '2026-10-22'
      }
    ]
  },
  {
    id: 'team-ops',
    name: '运维组',
    city: '深圳',
    owner: '李雯',
    status: '规划',
    progress: 35,
    amount: 7400,
    date: '2026-11-01'
  }
]

export interface TableSpanRow {
  group: string
  city: string
  owner: string
  orders: number
  amount: number
}

export const TABLE_SPAN_ROWS: TableSpanRow[] = [
  { group: '华东区', city: '上海', owner: '黄博', orders: 128, amount: 18600 },
  { group: '华东区', city: '杭州', owner: '李雯', orders: 96, amount: 12400 },
  { group: '华东区', city: '南京', owner: '吴桐', orders: 88, amount: 7600 },
  { group: '华南区', city: '深圳', owner: '陈可', orders: 143, amount: 15600 },
  { group: '华南区', city: '广州', owner: '何嘉', orders: 39, amount: 11200 },
  { group: '华北区', city: '北京', owner: '赵一鸣', orders: 18, amount: 4200 },
  { group: '华北区', city: '西安', owner: '郑凯', orders: 51, amount: 6400 },
  { group: '华北区', city: '苏州', owner: '林静', orders: 12, amount: 2800 }
]

export const TABLE_SPAN_GROUPS = TABLE_SPAN_ROWS.reduce<Record<string, number>>((groups, row) => {
  groups[row.group] = (groups[row.group] ?? 0) + 1
  return groups
}, {})

export interface TableEditRow extends TableDemoRow {
  dirty: boolean
}

const EDIT_NAMES = [
  '订单中心', '商品库', '库存台账', '客户档案', '结算单', '发票台', '物流跟踪', '售后工单',
  '优惠券', '会员等级', '权限组', '操作日志', '消息中心', '报表导出', '数据看板', '审批流',
  '合同管理', '预算编制', '供应商库', '采购单', '调拨单', '盘点单', '定价策略', '积分规则',
  '签到活动', '直播频道', '内容审核', '标签体系', '地区库', '币种汇率', '活动报名', '风控名单',
  '对账中心', '仓储看板', '配送调度', '客服排班', '质检报告', '工单流转', '需求池', '迭代计划'
]
const EDIT_CITIES = ['上海', '杭州', '成都', '深圳', '北京', '武汉', '南京', '西安', '苏州', '广州']
const EDIT_OWNERS = ['黄博', '李雯', '周子墨', '陈可', '赵一鸣', '孙悦', '吴桐', '郑凯', '林静', '何嘉']
const EDIT_STATUSES = ['稳定', '内测', '规划']
const EDIT_PROGRESS = [100, 82, 76, 68, 54, 35]
const EDIT_REMARKS = [
  '支持批量导入与字段校验，保存后同步到主数据。',
  '行内编辑直接落库，异常值会标红提示。',
  '含审批节点与操作留痕，可按城市筛选。',
  '数据量较大，表格内多组件同时渲染。',
  '冻结首尾列，横向滚动时保持上下文可见。'
]

export const TABLE_EDIT_ROWS: TableEditRow[] = EDIT_NAMES.map((name, index) => ({
  id: index + 1,
  name,
  city: EDIT_CITIES[index % EDIT_CITIES.length],
  owner: EDIT_OWNERS[index % EDIT_OWNERS.length],
  status: EDIT_STATUSES[index % EDIT_STATUSES.length],
  progress: EDIT_PROGRESS[index % EDIT_PROGRESS.length],
  orders: 12 + ((index * 7) % 120),
  amount: 2800 + ((index * 1730) % 30000),
  date: `2026-${String(10 - Math.floor(index / 14)).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
  remark: EDIT_REMARKS[index % EDIT_REMARKS.length],
  dirty: false
}))
