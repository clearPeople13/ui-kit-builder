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

export interface TableTreeRow {
  id: string
  name: string
  city: string
  owner: string
  status: string
  progress: number
  amount: number
  date: string
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
