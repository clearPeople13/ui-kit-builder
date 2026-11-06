import {
  CASCADER_BIG_OPTIONS,
  CASCADER_DEFAULT_CLEAR_PATH,
  CASCADER_MULTIPLE_VALUE,
  CASCADER_OPTIONS,
  CASCADER_OPTIONS_WITH_DISABLED,
  cascaderValueOnClear
} from './cascader-data'
import { FORM_EMPTY_MODEL, FORM_MODEL, FORM_PARTIAL_MODEL, FORM_RULES } from './form-data'
import { EXTRA_SCENE_PRESETS } from './presets-extra'
import { SAMPLE_AVATAR_A, SAMPLE_AVATAR_B } from './sample-image'
import { SELECT_CITY_OPTIONS, SELECT_VIRTUAL_10K_OPTIONS } from './select-data'
import { TABLE_LONG_ROWS, TABLE_SPAN_ROWS, TABLE_TREE_ROWS, makeHeavyRows } from './table-data'

export interface ScenePreset {
  id: string
  label: string
  hint?: string
  requires?: string | string[]
  values: Record<string, unknown>
}

const SELECT_CLEAR_OPTIONS = [{ label: '全部', value: 'all' }, ...SELECT_CITY_OPTIONS]

const TREE_DATA = [
  {
    id: 'forms',
    label: '表单组件',
    children: [
      { id: 'button', label: 'Button' },
      { id: 'input', label: 'Input' }
    ]
  },
  {
    id: 'data',
    label: '数据组件',
    children: [
      { id: 'table', label: 'Table' },
      { id: 'tree', label: 'Tree' }
    ]
  }
]

const TRANSFER_DATA = [
  { key: 'a', label: '选项 A' },
  { key: 'b', label: '选项 B' },
  { key: 'c', label: '选项 C' },
  { key: 'd', label: '选项 D' }
]

const RADIO_PLAN_OPTIONS = [
  { label: '标准版', value: 'standard' },
  { label: '专业版', value: 'pro' },
  { label: '旗舰版', value: 'ultimate', disabled: true }
]

// 自适应宽度演示：短/中/长三档标签，切换选中项观察宽度变化
const FIT_WIDTH_OPTIONS = [
  { label: '短', value: 'short' },
  { label: '中等长度', value: 'mid' },
  { label: '这是一个相当长的大幅度超出常规长度的选项文本', value: 'long' }
]

const TREE_FIT_DATA = [
  {
    id: 'group',
    label: '分组一',
    children: [
      { id: 'short', label: '短节点' },
      { id: 'long', label: '这是一个非常长的树节点名称用于演示文本省略效果' }
    ]
  }
]

const BASE_SCENE_PRESETS: Record<string, ScenePreset[]> = {
  Button: [
    { id: 'base', label: '基础', values: { type: 'primary' } },
    { id: 'plain', label: '朴素', requires: 'button.appearance', values: { type: 'primary', plain: true } },
    { id: 'text', label: '文字', requires: 'button.appearance', values: { type: 'primary', text: true } },
    { id: 'link', label: '链接', requires: 'button.appearance', values: { type: 'primary', link: true } },
    { id: 'round', label: '圆角', requires: 'button.appearance', values: { type: 'primary', round: true } },
    { id: 'loading', label: '加载中', requires: 'button.loading', values: { type: 'primary', loading: true } },
    { id: 'icon', label: '带图标', requires: 'button.icon', values: { type: 'primary', icon: 'star' } },
    {
      id: 'no-space',
      label: '两字不空格',
      requires: 'button.auto-insert-space',
      values: { type: 'primary', autoInsertSpace: false }
    },
    { id: 'bg-color', label: '背景色', requires: 'button.bg-color', values: { bgColor: '#3366ff' } },
    {
      id: 'gradient',
      label: '渐变',
      requires: 'button.gradient',
      values: { type: 'primary', gradient: true, gradientAngle: 45 }
    },
  ],
  Form: [
    {
      id: 'base',
      label: '右对齐标签',
      hint: '四个字段由插槽 scope.model 驱动，表单下方实时回显当前 model',
      values: { model: FORM_MODEL }
    },
    {
      id: 'label-width',
      label: '标签左对齐 + 宽度',
      values: { model: FORM_MODEL, labelPosition: 'left', labelWidth: '120px' }
    },
    { id: 'label-top', label: '顶部标签', values: { model: FORM_MODEL, labelPosition: 'top' } },
    { id: 'inline', label: '行内表单', values: { model: FORM_MODEL, inline: true, labelWidth: '72px' } },
    {
      id: 'small',
      label: '紧凑尺寸',
      hint: 'size 由 Form 继承给 FormItem 与四个字段',
      values: { model: FORM_MODEL, size: 'small' }
    },
    {
      id: 'disabled',
      label: '禁用状态',
      hint: '表单与全部字段禁用，标签同步置灰',
      values: { model: FORM_MODEL, disabled: true }
    },
    {
      id: 'validate',
      label: '必填校验',
      requires: 'form.validate',
      hint: '空 model 立即暴露必填错误，输入名称或选择日期后错误即时清除',
      values: { model: FORM_EMPTY_MODEL, rules: FORM_RULES }
    },
    {
      id: 'status-icon',
      label: '校验状态图标',
      requires: 'form.validate',
      hint: '未通过的字段显示红色 ×，已填写的必填字段显示绿色 ✓，边框同步变色',
      values: { model: FORM_PARTIAL_MODEL, rules: FORM_RULES, statusIcon: true }
    },
    {
      id: 'inline-message',
      label: '错误信息同行',
      requires: 'form.validate',
      hint: 'inlineMessage 把错误文案定位到字段底部，输入框位置不跳动',
      values: { model: FORM_EMPTY_MODEL, rules: FORM_RULES, inlineMessage: true }
    },
    {
      id: 'asterisk',
      label: '星号右置 + 标签后缀',
      requires: 'form.validate',
      hint: '必填星号移到标签右侧，labelSuffix 为每个标签补上全角冒号',
      values: { model: FORM_MODEL, rules: FORM_RULES, requireAsteriskPosition: 'right', labelSuffix: '：' }
    },
    {
      id: 'hide-asterisk',
      label: '隐藏必填星号',
      requires: 'form.validate',
      hint: '星号隐藏但校验规则保留，字段仍会显示错误',
      values: { model: FORM_EMPTY_MODEL, rules: FORM_RULES, hideRequiredAsterisk: true }
    },
    {
      id: 'hide-message',
      label: '隐藏错误文案',
      requires: 'form.validate',
      hint: 'showMessage 关闭后只保留红色边框与状态，不显示错误文字',
      values: { model: FORM_EMPTY_MODEL, rules: FORM_RULES, showMessage: false }
    }
  ],
  FormItem: [
    { id: 'base', label: '基础', values: { label: '项目名称', prop: 'name' } },
    { id: 'required', label: '必填星号', values: { label: '项目名称', prop: 'name', required: true } },
    {
      id: 'label-left',
      label: '标签左对齐',
      values: { label: '项目名称', prop: 'name', labelPosition: 'left', labelWidth: '120px' }
    },
    { id: 'label-top', label: '顶部标签', values: { label: '项目名称', prop: 'name', labelPosition: 'top' } },
    { id: 'error', label: '校验失败', values: { label: '项目名称', prop: 'name', error: '请输入项目名称' } },
    { id: 'success', label: '校验通过', values: { label: '项目名称', prop: 'name', validateStatus: 'success' } },
    {
      id: 'inline-message',
      label: '行内错误',
      requires: 'form.form-item-validate',
      hint: '错误文案绝对定位在字段底部，开启后不改变输入框位置',
      values: { label: '项目名称', prop: 'name', error: '请输入项目名称', inlineMessage: true }
    },
    {
      id: 'hide-message',
      label: '隐藏错误文案',
      requires: 'form.form-item-validate',
      hint: '保留错误边框但隐藏文字',
      values: { label: '项目名称', prop: 'name', error: '请输入项目名称', showMessage: false }
    }
  ],
  Input: [
    { id: 'base', label: '基础', values: {} },
    {
      id: 'clearable',
      label: '可清除',
      requires: 'input.clearable',
      values: { clearable: true, modelValue: '可清除的内容' }
    },
    {
      id: 'password',
      label: '密码',
      requires: 'input.password',
      values: { type: 'password', showPassword: true, modelValue: 'secret-demo' }
    },
    {
      id: 'word-limit',
      label: '字数统计',
      requires: 'input.word-limit',
      hint: '计数随输入实时更新，格式为“已输入/上限”',
      values: { showWordLimit: true, maxlength: 20, modelValue: '输入内容观察字数统计' }
    },
    {
      id: 'word-limit-outside',
      label: '计数在框外',
      requires: 'input.word-limit',
      hint: 'wordLimitPosition 设为 outside，计数器定位到输入框下方右侧',
      values: {
        showWordLimit: true,
        wordLimitPosition: 'outside',
        maxlength: 20,
        modelValue: '计数器显示在输入框下方'
      }
    },
    {
      id: 'word-limit-textarea',
      label: '文本域计数',
      requires: 'input.word-limit',
      hint: '文本域内部模式下计数固定在右下角，正文自动留出底部间距',
      values: {
        type: 'textarea',
        rows: 3,
        showWordLimit: true,
        maxlength: 30,
        modelValue: '多行文本域的字数统计固定在右下角，不遮挡正文内容。'
      }
    },
    {
      id: 'word-limit-exceed',
      label: '超出上限',
      requires: 'input.word-limit',
      hint: '外部赋值超过 maxlength 时计数标红，输入时仍受原生上限约束',
      values: { showWordLimit: true, maxlength: 10, modelValue: '这段内容超过十个字符限制' }
    },
    {
      id: 'icons',
      label: '前后缀图标',
      requires: 'input.icons',
      values: { prefixIcon: 'star', suffixIcon: 'calendar' }
    },
    { id: 'textarea', label: '文本域', values: { type: 'textarea', rows: 3, placeholder: '多行文本' } }
  ],
  InputNumber: [
    { id: 'base', label: '基础', values: { modelValue: 5 } },
    { id: 'disabled', label: '禁用', values: { modelValue: 5, disabled: true } }
  ],
  InputTag: [
    {
      id: 'base',
      label: '基础',
      hint: '输入回车添加，退格删除末尾标签',
      values: { modelValue: ['Vue', 'React'] }
    },
    {
      id: 'tag-type',
      label: '标签类型',
      hint: 'tagType=success，可选 success / warning / danger / info',
      values: { modelValue: ['Vue', 'Vite'], tagType: 'success' }
    },
    {
      id: 'effect-dark',
      label: '深色标签',
      hint: 'effect=dark，可再搭配 tagType 换色板',
      values: { modelValue: ['Vue', 'Vite'], effect: 'dark' }
    },
    {
      id: 'trigger-space',
      label: '空格生成标签',
      hint: 'trigger=Space，按空格立即生成（默认 Enter）',
      values: { modelValue: [], trigger: 'Space' }
    },
    {
      id: 'separator',
      label: '分隔符批量添加',
      requires: 'input-tag.separator',
      hint: 'separator=，输入或粘贴 a,b,c 一次生成多个标签',
      values: { modelValue: [], separator: ',' }
    },
    {
      id: 'disabled',
      label: '禁用',
      values: { modelValue: ['Vue', 'React'], disabled: true }
    },
    {
      id: 'draggable',
      label: '可拖拽',
      requires: 'input-tag.draggable',
      hint: 'draggable=true，拖动标签调整顺序',
      values: { draggable: true, modelValue: ['Vue', 'Vite', 'Vitest'] }
    },
    {
      id: 'clearable',
      label: '可清除',
      requires: 'input-tag.clearable',
      hint: '点击右侧清空按钮移除全部标签',
      values: { clearable: true, modelValue: ['Vue', 'Vite'] }
    }
  ],
  Autocomplete: [
    {
      id: 'base',
      label: '聚焦即补全',
      values: {
        modelValue: 'Vu',
        autofocus: true,
        fetchSuggestions: ['Vue', 'React', 'Angular', 'Svelte', 'Solid', 'Vite', 'TypeScript', 'JavaScript']
      }
    },
    {
      id: 'clearable',
      label: '可清除',
      hint: '悬停显示与 Select 一致的清除图标：0.75 透明度灰显，悬停图标加深至 1、无底色',
      requires: 'autocomplete.clearable',
      values: { clearable: true, modelValue: 'Vue' }
    },
    {
      id: 'remote',
      label: '远程搜索 + 加载',
      hint: 'debounce 500ms：等待期间面板显示与 Select 完全一致的共享加载条（居中灰字 + 12px 旋转圈）',
      requires: 'autocomplete.filterable',
      values: { modelValue: 'v', debounce: 500, autofocus: true }
    },
    {
      id: 'match-width',
      label: '等宽面板',
      requires: 'autocomplete.filterable',
      hint: '宽度严格等于输入框，超长建议省略显示',
      values: { modelValue: '', fitInputWidth: true, autofocus: true }
    },
    {
      id: 'word-limit',
      label: '字数统计',
      requires: 'autocomplete.word-limit',
      hint: '输入或选中建议后计数同步更新，超出上限标红',
      values: { showWordLimit: true, maxlength: 20, modelValue: 'Vue 自动补全' }
    },
    {
      id: 'icons',
      label: '前后缀图标',
      requires: 'autocomplete.icons',
      values: { prefixIcon: 'search', suffixIcon: 'arrowDown' }
    },
    {
      id: 'password',
      label: '密码',
      requires: 'autocomplete.password',
      hint: 'type=password 时出现眼睛按钮，点击切换明文',
      values: { type: 'password', showPassword: true, modelValue: 'secret-demo' }
    },
    {
      id: 'top',
      label: '上方弹出 + 无箭头',
      requires: 'autocomplete.popper',
      values: { modelValue: 'Vue', autofocus: true, placement: 'top-start', offset: 12, showArrow: false }
    }
  ],
  Calendar: [
    { id: 'base', label: '单选', values: { modelValue: '2026-10-26' } },
    {
      id: 'range',
      label: '选择范围',
      requires: 'calendar.range',
      values: { modelValue: '2026-10-26', range: [] }
    }
  ],
  AvatarGroup: [
    { id: 'base', label: '折叠 + 悬浮查看', values: { collapseAvatars: true, maxCollapseAvatars: 2 } },
    {
      id: 'right',
      label: '右侧弹出 + 无箭头',
      requires: 'avatar.avatar-group-popper',
      values: { placement: 'right', offset: 12, showArrow: false }
    }
  ],
  Mention: [
    { id: 'base', label: '输入 @ 唤起建议', values: { modelValue: '@' } },
    {
      id: 'word-limit',
      label: '字数统计',
      requires: 'mention.word-limit',
      hint: '提及内容的计数随输入实时更新，超出上限标红',
      values: { showWordLimit: true, maxlength: 30, modelValue: '@张三 请查看这条消息' }
    },
    {
      id: 'icons',
      label: '前后缀图标',
      requires: 'mention.icons',
      values: { prefixIcon: 'mail', suffixIcon: 'bell' }
    },
    {
      id: 'password',
      label: '密码',
      requires: 'mention.password',
      hint: 'type=password 时出现眼睛按钮，点击切换明文',
      values: { type: 'password', showPassword: true, modelValue: 'secret-demo' }
    },
    {
      id: 'top',
      label: '上方弹出',
      requires: 'mention.popper',
      values: { modelValue: '@', placement: 'top-start', offset: 8 }
    },
    {
      id: 'no-arrow',
      label: '右侧无箭头',
      requires: 'mention.popper',
      values: { modelValue: '@', placement: 'right-end', showArrow: false }
    }
  ],
  Dropdown: [
    {
      id: 'base',
      label: '悬停展开',
      hint: '六项账户菜单：图标前缀、禁用项、分隔线 + 退出登录；悬停按钮展开',
      values: {}
    },
    { id: 'click', label: '点击展开', values: { trigger: 'click' } },
    { id: 'dark', label: '深色面板', values: { trigger: 'click', effect: 'dark' } },
    {
      id: 'right',
      label: '右侧弹出 + 无箭头',
      requires: 'dropdown.popper',
      values: { trigger: 'click', placement: 'right-start', offset: 10, showArrow: false }
    }
  ],
  Popconfirm: [
    { id: 'base', label: '基础', values: { title: '确认执行该操作？' } },
    {
      id: 'top',
      label: '上方弹出',
      requires: 'popconfirm.popper',
      values: { placement: 'top', offset: 12 }
    },
    {
      id: 'no-teleport',
      label: '不传送浮层',
      requires: 'popconfirm.popper',
      values: { placement: 'bottom-start', teleported: false }
    },
    { id: 'dark', label: '深色主题', values: { effect: 'dark' } }
  ],
  Select: [
    { id: 'base', label: '基础', values: { options: SELECT_CITY_OPTIONS, modelValue: 'shanghai' } },
    {
      id: 'fit-width',
      label: '自适应宽度',
      hint: 'fitWidth=true，宽度跟随选中项；打开面板切换长选项观察变宽',
      values: { options: FIT_WIDTH_OPTIONS, modelValue: 'short', fitWidth: true }
    },
    {
      id: 'max-width',
      label: '最大宽度',
      hint: 'fitWidth + maxWidth=180：长文本最多 180px，超出省略',
      values: { options: FIT_WIDTH_OPTIONS, modelValue: 'long', fitWidth: true, maxWidth: 180 }
    },
    {
      id: 'clearable',
      label: '可清除 + 自定义图标',
      hint: '悬浮或聚焦时后缀箭头原位替换为清除按钮，两者同位置只显示一个；点击清空',
      requires: 'select.select-clearable',
      values: { options: SELECT_CITY_OPTIONS, modelValue: 'shanghai', clearable: true, clearIcon: 'error' }
    },
    {
      id: 'icons',
      label: '自定义后缀图标',
      hint: '后缀箭头由 chevron-down 替换为搜索图标，打开面板时同样旋转',
      requires: 'select.select-icons',
      values: { options: SELECT_CITY_OPTIONS, modelValue: 'shanghai', suffixIcon: 'search' }
    },
    {
      id: 'multiple',
      label: '多选',
      requires: 'select.select-multiple',
      values: { options: SELECT_CITY_OPTIONS, modelValue: ['shanghai', 'hangzhou'], multiple: true }
    },
    {
      id: 'filterable',
      label: '可搜索',
      hint: '18 个城市选项，输入关键字过滤，清空关键字恢复全部选项',
      requires: 'select.select-filterable',
      values: { options: SELECT_CITY_OPTIONS, modelValue: 'shanghai', filterable: true }
    },
    {
      id: 'loading',
      label: '加载中',
      hint: '每次打开面板先只显示旋转指示器与加载文案（无选项），约 1.5 秒后返回 18 个城市选项',
      requires: 'select.select-loading',
      values: { options: SELECT_CITY_OPTIONS, modelValue: '', loadingText: '正在加载选项…' }
    },
    {
      id: 'clear-refill',
      label: '清空回填「全部」',
      hint: '点击清除后 modelValue 回填 all，触发器展示「全部」',
      requires: ['select.select-clearable', 'select.select-format'],
      values: { options: SELECT_CLEAR_OPTIONS, modelValue: 'shanghai', clearable: true, valueOnClear: 'all' }
    },
    {
      id: 'top',
      label: '上方弹出 + 无箭头',
      requires: 'select.select-popper',
      values: {
        options: SELECT_CITY_OPTIONS,
        modelValue: 'shanghai',
        placement: 'top-start',
        offset: 14,
        showArrow: false
      }
    }
  ],
  SelectV2: [
    { id: 'base', label: '基础', values: { options: SELECT_CITY_OPTIONS, modelValue: 'shanghai' } },
    {
      id: 'virtual',
      label: '虚拟滚动（1 万条）',
      hint: '10000 条选项，DOM 只渲染可视区十余行：滚动时内容即时替换；开发者工具 Elements 里数 option 节点，不随数据量增长',
      values: { options: SELECT_VIRTUAL_10K_OPTIONS, modelValue: '' }
    },
    {
      id: 'fit-width',
      label: '自适应宽度',
      hint: 'fitWidth=true，宽度跟随选中项；打开面板切换长选项观察变宽',
      values: { options: FIT_WIDTH_OPTIONS, modelValue: 'short', fitWidth: true }
    },
    {
      id: 'max-width',
      label: '最大宽度',
      hint: 'fitWidth + maxWidth=180：长文本最多 180px，超出省略',
      values: { options: FIT_WIDTH_OPTIONS, modelValue: 'long', fitWidth: true, maxWidth: 180 }
    },
    {
      id: 'multiple',
      label: '多选',
      requires: 'select-v2.multiple',
      values: { options: SELECT_CITY_OPTIONS, modelValue: ['shanghai', 'hangzhou'], multiple: true }
    },
    {
      id: 'filterable',
      label: '可搜索',
      requires: 'select-v2.filterable',
      values: { options: SELECT_CITY_OPTIONS, modelValue: 'shanghai', filterable: true }
    },
    {
      id: 'clearable',
      label: '可清除',
      requires: 'select-v2.clearable',
      values: { options: SELECT_CITY_OPTIONS, modelValue: 'shanghai', clearable: true }
    },
    {
      id: 'top',
      label: '上方弹出 + 深色',
      requires: 'select-v2.popper',
      values: { options: SELECT_CITY_OPTIONS, modelValue: 'shanghai', placement: 'top-start', effect: 'dark' }
    }
  ],
  Cascader: [
    {
      id: 'base',
      label: '基础（三级联动）',
      values: { options: CASCADER_OPTIONS, modelValue: CASCADER_DEFAULT_CLEAR_PATH }
    },
    {
      id: 'fit-width',
      label: '自适应宽度',
      hint: 'fitWidth=true，宽度跟随选中路径文本',
      values: { options: CASCADER_OPTIONS, modelValue: CASCADER_DEFAULT_CLEAR_PATH, fitWidth: true }
    },
    {
      id: 'max-width',
      label: '最大宽度',
      hint: 'fitWidth + maxWidth=160：路径文本超出后省略',
      values: { options: CASCADER_OPTIONS, modelValue: CASCADER_DEFAULT_CLEAR_PATH, fitWidth: true, maxWidth: 160 }
    },
    {
      id: 'multiple',
      label: '多选 + 折叠标签',
      hint: '首列展示 1 个深色标签，其余收进 +N，悬浮 +N 查看完整路径',
      requires: 'cascader.multiple',
      values: {
        options: CASCADER_OPTIONS,
        multiple: true,
        modelValue: CASCADER_MULTIPLE_VALUE,
        collapseTags: true,
        collapseTagsTooltip: true,
        maxCollapseTags: 1,
        tagType: 'primary',
        tagEffect: 'dark'
      }
    },
    {
      id: 'collapse-two',
      label: '折叠标签 + 展开两条',
      hint: 'maxCollapseTags=2：前 2 个标签平铺，其余收进 +N，悬浮 +N 查看完整路径',
      requires: 'cascader.multiple',
      values: {
        options: CASCADER_OPTIONS,
        multiple: true,
        modelValue: CASCADER_MULTIPLE_VALUE,
        collapseTags: true,
        collapseTagsTooltip: true,
        maxCollapseTags: 2,
        tagType: 'primary',
        tagEffect: 'dark'
      }
    },
    {
      id: 'checkbox',
      requires: 'cascader.multiple',
      label: '多选 + 复选框',
      hint: 'checkbox：每级节点都有复选框，点击复选框级联选中全部叶子，部分选中显示半选；点击行仅展开下钻；配合 checkStrictly 可逐级独立勾选',
      values: {
        options: CASCADER_OPTIONS,
        multiple: true,
        checkbox: true,
        modelValue: CASCADER_MULTIPLE_VALUE.slice(0, 2),
        tagType: 'primary',
        tagEffect: 'dark'
      }
    },
    {
      id: 'checkbox-disabled',
      requires: 'cascader.multiple',
      label: '复选框 + 禁用项',
      hint: '余杭区/罗湖区已禁用：禁用叶子不可勾选，也不计入级联统计；勾选浙江省仍会把 8 个可用区全选并让省呈全选态',
      values: {
        options: CASCADER_OPTIONS_WITH_DISABLED,
        multiple: true,
        checkbox: true,
        modelValue: CASCADER_MULTIPLE_VALUE.slice(0, 2),
        tagType: 'primary',
        tagEffect: 'dark'
      }
    },
    {
      id: 'fit-width-tags',
      requires: 'cascader.multiple',
      label: '标签 + 自适应宽度',
      hint: '多选标签模式下 fitWidth=true：宽度跟随已选标签，未选时保持占位宽度，选满后自动撑开',
      values: {
        options: CASCADER_OPTIONS,
        multiple: true,
        fitWidth: true,
        modelValue: CASCADER_MULTIPLE_VALUE.slice(0, 1),
        tagType: 'primary',
        tagEffect: 'dark'
      }
    },
    {
      id: 'tag-all-levels',
      requires: 'cascader.multiple',
      label: '标签显示全路径',
      hint: 'showAllLevels=true（默认）：tag 展示 省 / 市 / 区 完整层级',
      values: {
        options: CASCADER_OPTIONS,
        multiple: true,
        showAllLevels: true,
        modelValue: CASCADER_MULTIPLE_VALUE.slice(0, 2),
        tagType: 'primary',
        tagEffect: 'dark'
      }
    },
    {
      id: 'tag-last-level',
      requires: 'cascader.multiple',
      label: '标签只显示末级',
      hint: 'showAllLevels=false：tag 只展示最后一级，单选回显同理',
      values: {
        options: CASCADER_OPTIONS,
        multiple: true,
        showAllLevels: false,
        modelValue: CASCADER_MULTIPLE_VALUE.slice(0, 3),
        tagType: 'primary',
        tagEffect: 'dark'
      }
    },
    {
      id: 'select-all',
      label: '大数据全选',
      hint: '2400 个叶子节点虚拟滚动，顶部全选栏一次写入/清空全部叶子路径',
      requires: ['cascader.multiple', 'cascader.select-all'],
      values: {
        options: CASCADER_BIG_OPTIONS,
        multiple: true,
        selectAll: true,
        collapseTags: true,
        maxCollapseTags: 1,
        virtualScroll: true,
        modelValue: []
      }
    },
    {
      id: 'select-all-value',
      label: '全选存末级值',
      hint: 'emitPath=false：v-model 只存末级值数组，不做全路径拼接',
      requires: ['cascader.multiple', 'cascader.select-all'],
      values: {
        options: CASCADER_OPTIONS,
        multiple: true,
        selectAll: true,
        emitPath: false,
        modelValue: []
      }
    },
    {
      id: 'select-all-strict',
      label: '父子不关联全选',
      hint: 'checkStrictly：父级可单独勾选，全选=全部已加载节点（含中间节点）',
      requires: ['cascader.multiple', 'cascader.select-all'],
      values: {
        options: CASCADER_OPTIONS,
        multiple: true,
        selectAll: true,
        checkStrictly: true,
        modelValue: []
      }
    },
    {
      id: 'clearable',
      label: '可清除',
      requires: 'cascader.clearable',
      values: {
        options: CASCADER_OPTIONS,
        modelValue: ['jiangsu', 'nanjing', 'js-nanjing-2'],
        clearable: true
      }
    },
    {
      id: 'filterable',
      label: '输入关键字筛选',
      hint: '输入“杭州”或“区”观察 300ms 防抖后的筛选结果',
      requires: 'cascader.filterable',
      values: {
        options: CASCADER_OPTIONS,
        modelValue: undefined,
        filterable: true,
        placeholder: '输入城市或区名筛选'
      }
    },
    {
      id: 'top',
      label: '上方弹出 + 深色',
      requires: 'cascader.popper',
      values: {
        options: CASCADER_OPTIONS,
        modelValue: CASCADER_DEFAULT_CLEAR_PATH,
        placement: 'top-start',
        effect: 'dark'
      }
    },
    {
      id: 'lazy',
      label: '逐级懒加载',
      hint: '打开面板后逐级点击，每级请求期间行尾显示共享加载条（12px 旋转圈 + 加载中…）',
      requires: 'cascader.lazy',
      values: {
        options: [],
        modelValue: undefined,
        lazy: true,
        placeholder: '展开大区，逐级加载下一级'
      }
    },
    {
      id: 'virtualized',
      label: '虚拟滚动（400 项）',
      hint: '首列 400 个区域只渲染可视窗口，滚动查看',
      requires: 'cascader.virtualized',
      values: {
        options: CASCADER_BIG_OPTIONS,
        modelValue: undefined,
        virtualScroll: true,
        itemSize: 34,
        height: 238,
        placeholder: '展开首列的 400 个区域'
      }
    },
    {
      id: 'format',
      label: '清空后回填默认值',
      hint: '悬浮触发清除按钮，点击后回填 valueOnClear 指定的默认路径',
      requires: ['cascader.clearable', 'cascader.format'],
      values: {
        options: CASCADER_OPTIONS,
        modelValue: ['jiangsu', 'nanjing', 'js-nanjing-2'],
        clearable: true,
        valueOnClear: cascaderValueOnClear
      }
    }
  ],
  DatePicker: [
    { id: 'base', label: '基础', values: { modelValue: '2026-10-26' } },
    {
      id: 'default-value',
      label: '默认日期',
      hint: 'modelValue 为空时打开面板，日历定位并高亮 defaultValue 指定的 2026-10-01；输入框保持占位',
      values: { modelValue: '', defaultValue: '2026-10-01' }
    },
    {
      id: 'clearable',
      label: '可清除 + 自定义图标',
      hint: '悬浮或聚焦时后缀箭头原位替换为清除按钮，两者同位置只显示一个；点击清空',
      requires: 'date-picker.clearable',
      values: { modelValue: '2026-10-26', clearable: true, clearIcon: 'error' }
    },
    {
      id: 'icons',
      label: '自定义前缀图标',
      hint: '前缀图标由日历替换为时钟',
      requires: 'date-picker.icons',
      values: { modelValue: '2026-10-26', prefixIcon: 'clock' }
    },
    {
      id: 'popper',
      label: '上方弹出 + 自定义浮层',
      hint: '浮层优先向上弹出，并用 popperStyle 加粗边框与阴影；panelScroll=close 时页面滚动会关闭面板',
      requires: 'date-picker.popper',
      values: {
        modelValue: '2026-10-26',
        placement: 'top-start',
        panelScroll: 'close',
        popperStyle: {
          border: '1px solid #0f766e',
          boxShadow: '0 14px 36px rgba(15, 118, 110, 0.28)'
        }
      }
    },
    {
      id: 'editable',
      label: '输入框直接编辑',
      hint: '在输入框键入 2026-12-25 后回车或失焦生效；关闭特性后输入框只读',
      requires: 'date-picker.editable',
      values: { modelValue: '2026-10-26', editable: true }
    },
    {
      id: 'format',
      label: '输出格式 + 清空回填',
      hint: '选中日期后按 YYYY/MM/DD 输出；清空时回填 2026/01/01，可在属性调试查看 modelValue',
      requires: ['date-picker.clearable', 'date-picker.format'],
      values: {
        modelValue: '2026/10/26',
        clearable: true,
        valueFormat: 'YYYY/MM/DD',
        valueOnClear: '2026/01/01'
      }
    },
    {
      id: 'range',
      label: '区间 + 周数 + 独立面板',
      hint: '分隔符改为“至”并自定义起止占位；开启 ISO 周数列，左右面板各自翻月；重新打开时左栏回显开始月、右栏回显结束月',
      requires: 'date-picker.range',
      values: {
        isRange: true,
        modelValue: ['2026-10-01', '2027-01-31'],
        rangeSeparator: '至',
        startPlaceholder: '入住日期',
        endPlaceholder: '离店日期',
        showWeekNumber: true,
        unlinkPanels: true
      }
    }
  ],
  TimePicker: [
    { id: 'base', label: '基础', values: { modelValue: '10:30:00' } },
    {
      id: 'default-value',
      label: '默认时间',
      hint: 'modelValue 为空时打开面板，时/分列定位到 defaultValue 指定的 08:15；输入框保持占位',
      values: { modelValue: '', defaultValue: '08:15:00' }
    },
    {
      id: 'clearable',
      label: '可清除',
      requires: 'time-picker.clearable',
      values: { modelValue: '10:30:00', clearable: true }
    },
    {
      id: 'icons',
      label: '自定义前缀图标',
      hint: '触发器左侧时钟替换为铃铛图标，槽位与间距不变',
      requires: 'time-picker.icons',
      values: { modelValue: '10:30:00', prefixIcon: 'bell' }
    },
    {
      id: 'format-display',
      label: '显示格式',
      hint: 'format 设为 HH:mm：触发器与面板都不再显示秒，v-model 输出跟随为 HH:mm',
      values: { modelValue: '10:30', format: 'HH:mm' }
    },
    {
      id: 'format-output',
      label: '格式化输出',
      hint: 'valueFormat 设为 HH:mm：显示仍是 10:30:00，但 v-model 只输出 10:30',
      requires: 'time-picker.format',
      values: { modelValue: '10:30', valueFormat: 'HH:mm' }
    },
    {
      id: 'clear-refill',
      label: '清空回填',
      hint: 'valueOnClear 设为 00:00:00：清除后不清空，而是回填 00:00:00',
      requires: ['time-picker.format', 'time-picker.clearable'],
      values: { modelValue: '10:30:00', valueOnClear: '00:00:00' }
    },
    {
      id: 'range',
      label: '时间范围',
      hint: '结束时间不可早于开始时间，开始时间不可晚于结束时间，越界的时/分/秒已置灰',
      requires: 'time-picker.range',
      values: { isRange: true, modelValue: ['10:30:20', '11:45:40'] }
    },
    {
      id: 'top',
      label: '上方弹出',
      requires: 'time-picker.popper',
      values: { modelValue: '10:30:00', placement: 'top-start' }
    }
  ],
  TimeSelect: [
    { id: 'base', label: '基础', values: { modelValue: '10:30' } },
    {
      id: 'clearable',
      label: '可清除',
      requires: 'time-select.clearable',
      values: { modelValue: '10:30', clearable: true }
    },
    { id: 'step', label: '15 分钟步长', values: { modelValue: '10:30', step: '00:15' } },
    {
      id: 'icons',
      label: '前缀图标',
      requires: 'time-select.icons',
      values: { modelValue: '10:30', prefixIcon: 'bell' }
    }
  ],
  Tag: [
    { id: 'base', label: '基础', values: {} },
    { id: 'round', label: '圆角', requires: 'tag.appearance', values: { round: true } },
    { id: 'closable', label: '可关闭', requires: 'tag.closable', values: { closable: true } }
  ],
  Alert: [
    { id: 'base', label: '基础', values: { type: 'info', title: '提示标题', description: '一段提示说明。' } },
    {
      id: 'icons',
      label: '带图标',
      requires: 'alert.icons',
      values: { type: 'success', showIcon: true, title: '成功提示', description: '图标特性已启用。' }
    },
    {
      id: 'closable',
      label: '可关闭',
      requires: 'alert.closable',
      values: { type: 'warning', closable: true, title: '可关闭提示', description: '点击右侧关闭。' }
    }
  ],
  Progress: [
    { id: 'base', label: '基础', values: { percentage: 62 } },
    { id: 'circle', label: '环形', values: { type: 'circle', percentage: 72 } }
  ],
  Table: [
    { id: 'base', label: '基础表格', hint: '十行数据、七列，行高与边框走主题令牌', values: {} },
    {
      id: 'fit',
      label: '自动铺满剩余宽度',
      hint: '设了 width 的列保持原宽，未设 width 的列从 minWidth 起步均分剩余空间',
      values: {}
    },
    {
      id: 'stripe',
      label: '斑马纹 + 边框',
      hint: 'stripe 隔行底色，border 补齐纵向分隔线',
      values: { stripe: true, border: true }
    },
    { id: 'small', label: '紧凑尺寸', values: { size: 'small', height: 240 } },
    { id: 'large', label: '宽松尺寸', values: { size: 'large' } },
    {
      id: 'highlight',
      label: '高亮当前行',
      hint: '点击行切换高亮，current-change 带回整行数据',
      values: { highlightCurrentRow: true }
    },
    { id: 'no-header', label: '隐藏表头', values: { showHeader: false } },
    {
      id: 'auto-layout',
      label: '内容自适应布局',
      hint: 'tableLayout="auto" 由浏览器按内容分配列宽，适合列少且文案长度不固定的表格',
      values: { tableLayout: 'auto', fit: false }
    },
    {
      id: 'empty-text',
      label: '自定义空文案',
      hint: 'emptyText 替换默认“暂无数据”；需要图文内容时改用 empty 插槽',
      values: { data: [], emptyText: '没有匹配的组件' }
    },
    {
      id: 'fixed-height',
      label: '固定高度滚动',
      hint: 'height 锁住可视区，表头 sticky 不随内容滚走',
      values: { height: 220 }
    },
    {
      id: 'max-height',
      label: '最大高度 + 24 行',
      hint: 'maxHeight 只在内容超高时出现内部滚动条',
      values: { maxHeight: 220, data: TABLE_LONG_ROWS }
    },
    {
      id: 'overflow',
      label: '列内容省略',
      hint: '表格级 showOverflowTooltip 让所有文本列单行省略，悬停看 title',
      values: { showOverflowTooltip: true }
    },
    { id: 'empty', label: '空数据', values: { data: [] } },
    {
      id: 'empty-slot',
      label: '自定义空态',
      hint: 'empty 插槽整块接管空数据区域，可以放插画与重置按钮',
      values: { data: [] }
    },
    {
      id: 'fixed-left',
      label: '左冻结两列',
      hint: '单表结构：选择列与名称列 sticky 在左侧，横向滚动时其余列从下面穿过',
      values: { height: 300, border: true }
    },
    {
      id: 'fixed-right',
      label: '右冻结操作列',
      hint: '右侧 sticky 只需要量出右边界偏移，不复制第二张表',
      values: { height: 300, border: true }
    },
    {
      id: 'fixed-both',
      label: '双向冻结',
      hint: '左名称 + 右操作同时固定，中间六列滚动，接缝阴影跟随滚动方向出现',
      values: { height: 300, border: true, stripe: true }
    },
    {
      id: 'sort',
      label: '单列排序',
      hint: '默认按预算倒序；点击表头在升序 / 降序 / 取消之间循环',
      requires: ['table.sort', 'table.column-sort'],
      values: { defaultSort: { prop: 'amount', order: 'descending' } }
    },
    {
      id: 'multi-sort',
      label: '多列排序',
      hint: '先按状态升序，再按预算降序；表头上的序号就是比较优先级',
      requires: ['table.sort', 'table.column-sort'],
      values: {
        multiSort: true,
        defaultSort: [
          { prop: 'status', order: 'ascending' },
          { prop: 'amount', order: 'descending' }
        ]
      }
    },
    {
      id: 'selection',
      label: '多选列',
      hint: '表头全选与行选择联动，selection-change 带回选中行数组',
      requires: 'table.selection',
      values: {}
    },
    {
      id: 'selectable',
      label: '部分行禁选',
      hint: 'selectable 返回 false 的行复选框禁用，全选只统计可选行',
      requires: 'table.selection',
      values: { highlightCurrentRow: true }
    },
    {
      id: 'methods',
      label: '实例方法控制选择',
      hint: '通过 ref 调用 toggleAllSelection / clearSelection，选择结果由 selection-change 实时回传',
      requires: 'table.methods',
      values: {}
    },
    {
      id: 'expand',
      label: '展开行',
      hint: 'expand 列的默认插槽就是展开区内容，展开行跨满整行',
      values: {}
    },
    {
      id: 'span',
      label: '合并单元格',
      hint: 'spanMethod 把同区域首行合并 3 行，被合并的格子不再渲染',
      requires: 'table.span',
      values: { data: TABLE_SPAN_ROWS, border: true, stripe: true }
    },
    {
      id: 'tree',
      label: '树形数据',
      hint: 'children 嵌套展开为树形行，首列渲染缩进与折叠箭头',
      requires: 'table.tree',
      values: { data: TABLE_TREE_ROWS }
    },
    {
      id: 'tree-expanded',
      label: '树形默认全展开',
      hint: 'defaultExpandAll=true，挂载即展开所有父节点；仍可逐级收起',
      requires: 'table.tree',
      values: { data: TABLE_TREE_ROWS, defaultExpandAll: true }
    },
    {
      id: 'tree-select',
      label: '树形多选（联动）',
      hint: '默认父子联动：勾选父级带上全部子孙，子级部分选中时父级显示半选',
      requires: ['table.tree', 'table.selection'],
      values: { data: TABLE_TREE_ROWS, rowKey: 'id', defaultExpandAll: true }
    },
    {
      id: 'tree-select-strict',
      label: '树形多选（严格）',
      hint: 'checkStrictly：父子互不联动，父级不会带选子孙，也没有半选',
      requires: ['table.tree', 'table.selection'],
      values: { data: TABLE_TREE_ROWS, rowKey: 'id', defaultExpandAll: true, checkStrictly: true }
    },
    {
      id: 'checkbox-hidden',
      label: '勾选框显隐',
      hint: 'showCheckbox 传函数按行隐藏勾选框，被隐藏的行不入选也不参与全选',
      requires: 'table.selection',
      values: {}
    },
    {
      id: 'resize',
      label: '拖拽列宽',
      hint: '拖表头右缘改列宽，双击手柄恢复默认；resize-change 输出 key 与宽度',
      requires: 'table.resize',
      values: { resizable: true, border: true, height: 240 }
    },
    {
      id: 'summary',
      label: '合计行',
      hint: '默认对所有数值列求和，首列显示 sumText，可换 summaryMethod',
      requires: 'table.summary',
      values: { showSummary: true, sumText: '合计', height: 240 }
    },
    {
      id: 'loading',
      label: '加载遮罩',
      hint: 'loading 覆盖整表并锁住指针，loadingText 可自定义文案',
      requires: 'table.loading',
      values: { data: TABLE_LONG_ROWS, loading: true, loadingText: '正在加载组件数据…', height: 260 }
    },
    {
      id: 'custom',
      label: '自定义单元格与表头',
      hint: '默认插槽接管单元格（Tag / Progress / 操作按钮），header 插槽在标题后追加标记',
      values: {}
    },
    {
      id: 'row-style',
      label: '行类名与行样式',
      hint: 'rowClassName 给“规划”行加灰底，rowStyle 让需求数 ≥ 100 的行整体加粗',
      values: {}
    },
    {
      id: 'comprehensive',
      label: '综合：冻结 + 多选 + 排序 + 拖拽 + 合计',
      hint: '所有能力同时开：横向滚动、双向冻结、多列排序、列宽拖拽与底部合计',
      requires: ['table.sort', 'table.column-sort', 'table.selection', 'table.resize', 'table.summary'],
      values: {
        height: 320,
        stripe: true,
        border: true,
        highlightCurrentRow: true,
        resizable: true,
        showSummary: true,
        sumText: '合计',
        multiSort: true,
        defaultSort: [{ prop: 'amount', order: 'descending' }]
      }
    },
    {
      id: 'editable',
      label: '复杂：表内编辑 + 双向冻结',
      hint: '40 行数据，每行 Input / Select / InputNumber / DatePicker / Slider 与操作按钮，左右冻结、可拖列宽、底部合计',
      requires: ['table.selection', 'table.resize', 'table.summary'],
      values: {
        height: 440,
        stripe: true,
        border: true,
        resizable: true,
        showSummary: true,
        sumText: '合计',
        rowKey: 'id'
      }
    },
    {
      id: 'heavy-data',
      label: '大数据：5 千行',
      hint: '确定性生成的 5000 行压测数据，行字段全部由行号推导；开启 virtual 只渲染可视窗口行',
      requires: 'table.resize',
      values: { data: makeHeavyRows(5000), height: 420, stripe: true, resizable: true, virtual: true }
    },
    {
      id: 'heavy-data-20k',
      label: '大数据：2 万行',
      hint: '20000 行同口径压测数据，virtual 窗口化渲染，滚动只重绘可视区',
      requires: 'table.resize',
      values: { data: makeHeavyRows(20000), height: 420, stripe: true, resizable: true, virtual: true }
    },
    {
      id: 'heavy-data-100k',
      label: '大数据：10 万行',
      hint: '100000 行同口径压测数据，virtual 窗口化渲染的极限档位，进场景与滚动都保持流畅',
      requires: 'table.resize',
      values: { data: makeHeavyRows(100000), height: 420, stripe: true, resizable: true, virtual: true }
    },
    {
      id: 'editable-heavy',
      label: '复杂：大表编辑 + 冻结 + 合计 + 合并',
      hint: '2000 行确定性数据，每行 Input / Select / InputNumber / DatePicker / Slider 与操作按钮，模块列每 50 行合并，双向冻结 + 列宽拖拽 + 底部合计，virtual 窗口化渲染、合并块整体入窗',
      requires: ['table.selection', 'table.resize', 'table.summary', 'table.span'],
      values: {
        height: 440,
        stripe: true,
        border: true,
        resizable: true,
        showSummary: true,
        sumText: '合计',
        rowKey: 'id',
        virtual: true,
        heavyRows: 2000
      }
    },
    {
      id: 'heavy-variable',
      label: '大数据：5 万行 · 行高不一',
      hint: '50000 行压测数据，说明列 1-4 行不等导致行高不一致，virtual 按实测行高定位，滚动不跳行',
      requires: 'table.resize',
      values: { data: makeHeavyRows(50000), height: 420, stripe: true, resizable: true, virtual: true }
    }
  ],
  Tabs: [
    { id: 'base', label: '基础', values: {} },
    { id: 'left', label: '左侧标签', values: { tabPosition: 'left' } },
    { id: 'stretch', label: '拉伸', values: { stretch: true } }
  ],
  MessageBox: [
    {
      id: 'base',
      label: '基础',
      hint: '默认锁定背景滚动，关闭后恢复',
      values: { title: '操作提示', message: '确认执行该操作吗？' }
    },
    {
      id: 'scroll-through',
      label: '允许滚动穿透',
      hint: 'lockScroll=false，打开消息框后仍可滚动背景页面',
      values: { title: '操作提示', message: '确认执行该操作吗？', lockScroll: false }
    }
  ],
  ImageViewer: [
    {
      id: 'base',
      label: '多图预览',
      hint: '内置 4 张在线实景图，点击缩略图切换；默认锁定背景滚动',
      values: {}
    },
    {
      id: 'scroll-through',
      label: '允许滚动穿透',
      requires: 'image-viewer.modal',
      hint: 'lockScroll=false，打开预览后仍可滚动背景页面',
      values: { lockScroll: false }
    }
  ],
  Dialog: [
    {
      id: 'base',
      label: '基础',
      hint: '默认锁定背景滚动，关闭后恢复',
      values: { title: '对话框标题' }
    },
    { id: 'wide', label: '宽屏', values: { title: '宽对话框', width: 720 } },
    {
      id: 'scroll-through',
      label: '允许滚动穿透',
      requires: 'dialog.modal',
      hint: 'lockScroll=false，打开对话框后仍可滚动背景页面',
      values: { title: '对话框标题', lockScroll: false }
    },
    {
      id: 'draggable',
      label: '可拖拽',
      requires: 'dialog.draggable',
      hint: 'draggable=true，按住标题栏拖动对话框，位置限制在视口内',
      values: { title: '拖动标题栏移动对话框', draggable: true }
    },
    {
      id: 'fullscreen',
      label: '全屏',
      requires: 'dialog.fullscreen',
      hint: 'fullscreen=true，对话框面板铺满视口',
      values: { title: '全屏对话框', fullscreen: true }
    }
  ],
  Drawer: [
    {
      id: 'rtl',
      label: '右侧抽屉',
      hint: '默认锁定背景滚动，关闭后恢复',
      values: { title: '抽屉标题', direction: 'rtl' }
    },
    { id: 'ltr', label: '左侧抽屉', values: { title: '抽屉标题', direction: 'ltr' } },
    { id: 'large', label: '加宽', values: { title: '抽屉标题', size: '50%' } },
    {
      id: 'scroll-through',
      label: '允许滚动穿透',
      requires: 'drawer.modal',
      hint: 'lockScroll=false，打开抽屉后仍可滚动背景页面',
      values: { title: '抽屉标题', direction: 'rtl', lockScroll: false }
    },
    {
      id: 'draggable',
      label: '可拖拽',
      requires: 'drawer.draggable',
      hint: 'draggable=true，按住标题栏拖动抽屉',
      values: { title: '拖动标题栏移动抽屉', direction: 'rtl', draggable: true }
    },
    {
      id: 'resizable',
      label: '可缩放',
      requires: 'drawer.draggable',
      hint: 'resizable=true，拖动抽屉内边缘调整宽度，标题栏仍可拖动',
      values: { title: '拖动内边缘调整尺寸', direction: 'rtl', draggable: true, resizable: true }
    },
    {
      id: 'resizable-ltr',
      label: '左侧可缩放',
      requires: 'drawer.draggable',
      hint: 'direction=ltr，拖动抽屉右边缘调整宽度',
      values: { title: '拖动右边缘调整尺寸', direction: 'ltr', draggable: true, resizable: true }
    },
    {
      id: 'resizable-ttb',
      label: '顶部可缩放',
      requires: 'drawer.draggable',
      hint: 'direction=ttb，拖动抽屉下边缘调整高度',
      values: { title: '拖动下边缘调整高度', direction: 'ttb', draggable: true, resizable: true }
    },
    {
      id: 'fullscreen',
      label: '全屏',
      requires: 'drawer.fullscreen',
      hint: 'fullscreen=true，抽屉面板铺满视口',
      values: { title: '全屏抽屉', fullscreen: true }
    }
  ],
  Popover: [
    { id: 'base', label: '基础', values: { content: '气泡内容，可在此观察宽度与主题。' } },
    {
      id: 'right',
      label: '右侧弹出',
      requires: 'popover.popper',
      values: { placement: 'right', content: '右侧弹出内容' }
    },
    { id: 'dark', label: '深色主题', values: { effect: 'dark', content: '深色主题气泡' } },
    { id: 'click', label: '点击触发', values: { trigger: 'click', content: '点击触发的气泡' } },
    {
      id: 'no-arrow',
      label: '无箭头 + 远间距',
      requires: 'popover.popper',
      values: { placement: 'left', offset: 18, showArrow: false, content: '无箭头气泡' }
    },
    { id: 'auto-close', label: '自动关闭', values: { autoClose: 1200, content: '移入后 1.2 秒自动关闭' } }
  ],
  Tooltip: [
    { id: 'base', label: '基础', values: { content: '提示内容' } },
    { id: 'right', label: '右侧提示', values: { placement: 'right', content: '右侧提示' } },
    { id: 'light', label: '浅色主题', values: { effect: 'light', content: '浅色主题提示' } },
    { id: 'no-arrow', label: '无箭头', values: { placement: 'left', showArrow: false, content: '无箭头提示' } },
    { id: 'click', label: '点击触发', values: { trigger: 'click', content: '点击触发的提示' } }
  ],
  Rate: [
    { id: 'base', label: '基础', values: { modelValue: 3 } },
    { id: 'half', label: '允许半星', values: { modelValue: 3.5, allowHalf: true } },
    {
      id: 'text',
      label: '显示分数',
      hint: 'scoreTemplate 可定制分数文案',
      values: { modelValue: 4, showScore: true, scoreTemplate: '{value} 分' }
    },
    {
      id: 'texts',
      label: '显示文案',
      hint: 'texts 按星级取文案，可与 showText 搭配',
      values: { modelValue: 4, showText: true, textColor: '#b45309', texts: ['很差', '较差', '一般', '满意', '惊喜'] }
    },
    {
      id: 'icons',
      label: '自定义图标与配色',
      hint: 'icons/colors 按阈值分三段生效',
      values: {
        modelValue: 5,
        icons: ['star', 'heart', 'flame'],
        voidIcon: 'heart',
        colors: ['#99a9bf', '#f7ba2a', '#ff7a45']
      }
    },
    {
      id: 'clearable',
      label: '可清空',
      requires: 'rate.clearable',
      hint: '再次点击当前评分清零',
      values: { modelValue: 3, clearable: true }
    },
    {
      id: 'disabled',
      label: '禁用',
      hint: 'disabledVoidColor / voidColor 覆盖未选中星色',
      values: { modelValue: 3, disabled: true, voidColor: '#e5e7eb', disabledVoidColor: '#fbbf24' }
    },
    { id: 'small', label: '小尺寸', values: { modelValue: 3, size: 'small' } },
    { id: 'large', label: '大尺寸', values: { modelValue: 3, size: 'large' } }
  ],
  Slider: [
    { id: 'base', label: '基础', values: { modelValue: 40 } },
    { id: 'range', label: '范围', requires: 'slider.range', values: { modelValue: [20, 60], range: true } },
    { id: 'vertical', label: '竖向', values: { modelValue: 40, vertical: true, height: '200px' } },
    {
      id: 'input',
      label: '带输入框',
      hint: 'inputSize 调整输入框尺寸',
      values: { modelValue: 40, showInput: true, inputSize: 'small' }
    },
    {
      id: 'input-no-controls',
      label: '输入框无步进',
      values: { modelValue: 40, showInput: true, showInputControls: false }
    },
    { id: 'small', label: '小尺寸', hint: '轨道与滑块整体变细变小', values: { modelValue: 40, size: 'small' } },
    { id: 'large', label: '大尺寸', hint: '轨道与滑块整体加粗变大', values: { modelValue: 40, size: 'large' } }
  ],
  Switch: [
    { id: 'base', label: '基础', values: { modelValue: true } },
    {
      id: 'text',
      label: '内联文案',
      values: { modelValue: true, activeText: '开', inactiveText: '关', inlinePrompt: true }
    },
    { id: 'loading', label: '加载中', requires: 'switch.loading', values: { modelValue: true, loading: true } }
  ],
  Radio: [
    { id: 'base', label: '基础', values: { label: '标准版', value: 'standard', modelValue: 'standard' } },
    { id: 'unchecked', label: '未选中', values: { label: '标准版', value: 'standard', modelValue: 'pro' } },
    {
      id: 'border',
      label: '卡片样式',
      requires: 'radio.appearance',
      hint: 'border=true，整块可点击并高亮选中态',
      values: { label: '标准版', value: 'standard', modelValue: 'standard', border: true }
    },
    {
      id: 'small',
      label: '小尺寸',
      values: { label: '标准版', value: 'standard', modelValue: 'standard', size: 'small' }
    },
    {
      id: 'large',
      label: '大尺寸',
      values: { label: '标准版', value: 'standard', modelValue: 'standard', size: 'large' }
    },
    {
      id: 'disabled',
      label: '禁用',
      values: { label: '标准版', value: 'standard', modelValue: 'standard', disabled: true }
    }
  ],
  RadioButton: [
    { id: 'base', label: '基础', values: { label: '按月付费', value: 'monthly', modelValue: 'monthly' } },
    { id: 'unchecked', label: '未选中', values: { label: '按月付费', value: 'monthly', modelValue: 'yearly' } },
    {
      id: 'small',
      label: '小尺寸',
      values: { label: '按月付费', value: 'monthly', modelValue: 'monthly', size: 'small' }
    },
    {
      id: 'large',
      label: '大尺寸',
      values: { label: '按月付费', value: 'monthly', modelValue: 'monthly', size: 'large' }
    },
    {
      id: 'disabled',
      label: '禁用',
      values: { label: '按月付费', value: 'monthly', modelValue: 'monthly', disabled: true }
    }
  ],
  RadioGroup: [
    { id: 'base', label: '基础', values: { options: RADIO_PLAN_OPTIONS, modelValue: 'pro' } },
    {
      id: 'empty',
      label: '未选中',
      values: { options: RADIO_PLAN_OPTIONS, modelValue: '' }
    },
    {
      id: 'button',
      label: '按钮组',
      hint: 'type=button，同组选项合并成分段控件',
      values: { options: RADIO_PLAN_OPTIONS, modelValue: 'pro', type: 'button' }
    },
    {
      id: 'fill',
      label: '自定义配色',
      hint: 'fill 与 textColor 控制选中块的颜色',
      values: {
        options: RADIO_PLAN_OPTIONS,
        modelValue: 'pro',
        type: 'button',
        fill: '#6d5efc',
        textColor: '#fff'
      }
    },
    {
      id: 'small',
      label: '小尺寸',
      values: { options: RADIO_PLAN_OPTIONS, modelValue: 'pro', size: 'small' }
    },
    {
      id: 'large',
      label: '大尺寸',
      values: { options: RADIO_PLAN_OPTIONS, modelValue: 'pro', size: 'large' }
    },
    {
      id: 'disabled',
      label: '整组禁用',
      values: { options: RADIO_PLAN_OPTIONS, modelValue: 'pro', disabled: true }
    },
    {
      id: 'button-dark',
      label: '深色按钮组',
      hint: '按钮组叠加自定义填充色，演示配色可覆盖',
      values: {
        options: RADIO_PLAN_OPTIONS,
        modelValue: 'standard',
        type: 'button',
        fill: '#303133',
        textColor: '#ffd666'
      }
    }
  ],
  Pagination: [
    { id: 'base', label: '基础', values: { total: 128, currentPage: 3 } },
    { id: 'background', label: '背景块', values: { total: 128, currentPage: 3, background: true } },
    { id: 'small', label: '小尺寸', values: { total: 128, currentPage: 3, size: 'small' } },
    {
      id: 'layout',
      label: '完整布局',
      hint: 'layout 组合 total、sizes、jumper，pageSizes 控制每页条数选项',
      requires: 'pagination.layout',
      values: {
        total: 128,
        currentPage: 3,
        pageSize: 10,
        pageSizes: [10, 20, 50, 100],
        layout: 'total, sizes, prev, pager, next, jumper'
      }
    },
    { id: 'hide-single', label: '单页隐藏', hint: '只有一页时整体隐藏', values: { total: 8, hideOnSinglePage: true } }
  ],
  Steps: [
    { id: 'base', label: '基础', values: { active: 1 } },
    { id: 'simple', label: '简洁模式', values: { active: 2, simple: true } }
  ],
  Card: [
    { id: 'base', label: '基础', values: { header: '卡片标题' } },
    { id: 'shadow', label: '常显阴影', requires: 'card.appearance', values: { header: '卡片标题', shadow: 'always' } }
  ],
  Avatar: [
    { id: 'base', label: '图片头像', values: { size: 48, src: SAMPLE_AVATAR_A, alt: '示例头像' } },
    { id: 'square', label: '方形头像', values: { size: 48, shape: 'square', src: SAMPLE_AVATAR_B, alt: '示例头像' } },
    {
      id: 'icon',
      label: '图标头像',
      hint: 'src 置空后由 icons 特性渲染图标',
      requires: 'avatar.icons',
      values: { icon: 'star', size: 40, src: '' }
    }
  ],
  Badge: [
    { id: 'base', label: '基础', values: { value: 12 } },
    { id: 'dot', label: '圆点', values: { isDot: true } },
    { id: 'max', label: '最大值', values: { value: 120, max: 99 } }
  ],
  Descriptions: [
    { id: 'base', label: '基础', values: { title: '订单详情' } },
    {
      id: 'border',
      label: '带边框',
      requires: 'descriptions.appearance',
      values: { title: '订单详情', border: true }
    }
  ],
  Tree: [
    {
      id: 'base',
      label: '基础',
      values: {
        data: TREE_DATA,
        defaultExpandAll: true
      }
    },
    {
      id: 'check',
      label: '复选',
      values: {
        data: TREE_DATA,
        defaultExpandAll: true,
        showCheckbox: true,
        defaultCheckedKeys: ['button']
      }
    },
    {
      id: 'highlight',
      label: '高亮节点',
      values: {
        data: TREE_DATA,
        defaultExpandAll: true,
        highlightCurrent: true,
        currentNodeKey: 'table'
      }
    },
    {
      id: 'draggable',
      label: '可拖拽',
      requires: 'tree.draggable',
      hint: 'draggable=true，拖动节点到其他节点前、后或内部',
      values: {
        data: TREE_DATA,
        defaultExpandAll: true,
        draggable: true
      }
    }
  ],
  TreeSelect: [
    {
      id: 'base',
      label: '基础',
      values: {
        data: TREE_DATA,
        modelValue: 'button'
      }
    },
    {
      id: 'fit-width',
      label: '自适应宽度',
      hint: 'fitWidth=true，宽度跟随选中节点；展开树切换长短节点观察变宽',
      values: {
        data: TREE_FIT_DATA,
        modelValue: 'short',
        fitWidth: true,
        defaultExpandAll: true
      }
    },
    {
      id: 'max-width',
      label: '最大宽度',
      hint: 'fitWidth + maxWidth=180：长节点名最多 180px，超出省略',
      values: {
        data: TREE_FIT_DATA,
        modelValue: 'long',
        fitWidth: true,
        maxWidth: 180,
        defaultExpandAll: true
      }
    },
    {
      id: 'multiple',
      label: '多选',
      requires: 'tree-select.multiple',
      values: {
        data: TREE_DATA,
        modelValue: ['button', 'table'],
        multiple: true
      }
    },
    {
      id: 'filterable',
      label: '可搜索',
      requires: 'tree-select.filterable',
      values: {
        data: TREE_DATA,
        modelValue: 'button',
        filterable: true
      }
    },
    {
      id: 'top',
      label: '上方弹出 + 深色',
      requires: 'tree-select.popper',
      values: {
        data: TREE_DATA,
        modelValue: 'button',
        placement: 'top-start',
        effect: 'dark'
      }
    },
    {
      id: 'clearable',
      label: '可清除',
      hint: '悬浮或聚焦时后缀箭头原位替换为清除按钮，两者同位置只显示一个；点击清空选择',
      values: {
        data: TREE_DATA,
        modelValue: 'button',
        clearable: true
      }
    }
  ],
  Upload: [
    {
      id: 'base',
      label: '基础',
      hint: '选择文件后写入 fileList，可逐项移除',
      values: {
        fileList: [
          { name: 'component-guide.pdf', status: 'success', uid: 1 },
          { name: 'release-notes.md', status: 'success', uid: 2 }
        ]
      }
    },
    {
      id: 'drag',
      label: '拖拽上传',
      hint: 'drag 为 true 时触发器自带虚线拖拽区；accept 只放行图片，拖入其它类型会被静默过滤',
      values: { drag: true, accept: 'image/*' }
    },
    {
      id: 'no-list',
      label: '不显示文件列表',
      values: { showFileList: false }
    },
    { id: 'multiple', label: '多选', requires: 'upload.multiple', values: { multiple: true } }
  ],
  Transfer: [
    { id: 'base', label: '基础', values: { data: TRANSFER_DATA, modelValue: ['a'] } },
    {
      id: 'filterable',
      label: '可搜索',
      requires: 'transfer.filterable',
      values: { data: TRANSFER_DATA, modelValue: ['a'], filterable: true }
    }
  ],
  Menu: [
    {
      id: 'base',
      label: '基础',
      hint: '三组、三层菜单树，默认展开“组件库 → 基础组件”，激活项为顶级“构建概览”',
      values: { defaultActive: 'overview' }
    },
    {
      id: 'horizontal',
      label: '水平菜单',
      hint: '导航条不显示分组标题，子菜单浮出为面板；面板内再展开“基础组件”，三级子项 Button 为激活项',
      values: { mode: 'horizontal', defaultActive: 'button', defaultOpeneds: ['components', 'components-basic'] }
    },
    {
      id: 'collapse',
      label: '折叠菜单',
      hint: '只保留顶级条目：分组标题与子菜单内容收起，此时点击、悬停都不展开子菜单',
      values: { collapse: true, defaultActive: 'settings' }
    },
    {
      id: 'active-descendant',
      label: '子项选中父级标识',
      hint: '默认激活“组件库 → 基础组件 → Button”，两级父菜单保持收起，但标题文字高亮指示子树内有选中项；点开父级可看到具体选中项',
      values: { defaultActive: 'button', defaultOpeneds: [] }
    }
  ],
  Segmented: [
    {
      id: 'base',
      label: '基础',
      values: {
        options: [
          { label: '日', value: 'day' },
          { label: '周', value: 'week' },
          { label: '月', value: 'month' }
        ],
        modelValue: 'day'
      }
    }
  ],
  Divider: [
    { id: 'base', label: '基础', values: {} },
    { id: 'content', label: '带文案', values: { content: '分割线文案' } },
    {
      id: 'left',
      label: '左侧文案',
      values: { content: '左对齐文案', contentPosition: 'left' }
    },
    {
      id: 'right',
      label: '右侧文案',
      values: { content: '右对齐文案', contentPosition: 'right' }
    },
    { id: 'dashed', label: '虚线', values: { content: '虚线上方内容', borderStyle: 'dashed' } }
  ],
  Link: [
    { id: 'base', label: '基础', values: { href: '#/overview' } },
    {
      id: 'underline',
      label: '始终下划线',
      requires: 'link.appearance',
      values: { href: '#/overview', underline: 'always' }
    },
    {
      id: 'hover',
      label: '悬停下划线',
      requires: 'link.appearance',
      values: { href: '#/overview', underline: 'hover' }
    },
    {
      id: 'icon',
      label: '带图标',
      requires: 'link.icons',
      values: { href: '#/overview', icon: 'externalLink' }
    },
    {
      id: 'disabled',
      label: '禁用',
      values: { href: '#/overview', disabled: true }
    }
  ],
  Icon: [
    { id: 'base', label: '基础', values: { name: 'star' } },
    { id: 'large', label: '大尺寸', values: { name: 'star', size: 32 } },
    { id: 'color', label: '着色', values: { name: 'heart', color: '#e5484d' } },
    { id: 'spin', label: '旋转', values: { name: 'loader', spin: true } }
  ],
  Space: [
    { id: 'base', label: '基础间距', values: { size: 8, wrap: true } },
    { id: 'small', label: '紧凑', values: { size: 4, wrap: true } },
    { id: 'large', label: '宽松', values: { size: 24, wrap: true } },
    { id: 'vertical', label: '垂直', values: { direction: 'vertical', size: 8, alignment: 'start' } },
    { id: 'axis', label: '横纵间距', values: { size: [8, 24], wrap: true } }
  ],
  Text: [
    { id: 'base', label: '基础', values: {} },
    { id: 'type', label: '状态色', values: { type: 'success' } },
    { id: 'size', label: '大字号', values: { size: 'large' } },
    {
      id: 'truncated',
      label: '单行省略',
      values: { truncated: true, style: { maxWidth: '260px' } }
    },
    {
      id: 'clamp',
      label: '两行省略',
      values: { lineClamp: 2, style: { maxWidth: '320px' } }
    }
  ],
  ConfigProvider: [
    { id: 'base', label: '默认尺寸', values: {} },
    { id: 'large', label: '全局大尺寸', values: { size: 'large' } },
    { id: 'small', label: '全局小尺寸', values: { size: 'small' } }
  ],
  Statistic: [
    { id: 'base', label: '基础', values: { title: '用户总数', value: 1280 } },
    { id: 'prefix', label: '前缀后缀', values: { title: '交易额', value: 1280, prefix: '¥', suffix: '元' } }
  ],
  Countdown: [{ id: 'base', label: '基础', values: { value: 3661, title: '剩余时间' } }],
  Empty: [
    { id: 'base', label: '基础', values: {} },
    { id: 'description', label: '自定义描述', values: { description: '暂无搜索结果，换个关键词试试' } }
  ],
  Result: [{ id: 'base', label: '基础', values: { title: '操作成功', subTitle: '相关结果已生成，可以继续下一步。' } }]
}

function mergeScenePresets(
  base: Record<string, ScenePreset[]>,
  extra: Record<string, ScenePreset[]>
): Record<string, ScenePreset[]> {
  const merged: Record<string, ScenePreset[]> = { ...base }
  for (const [name, scenes] of Object.entries(extra)) {
    merged[name] = merged[name] ? [...merged[name], ...scenes] : [...scenes]
  }
  return merged
}

export const SCENE_PRESETS: Record<string, ScenePreset[]> = mergeScenePresets(BASE_SCENE_PRESETS, EXTRA_SCENE_PRESETS)
