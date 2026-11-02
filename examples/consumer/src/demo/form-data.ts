export interface FormDemoModel {
  name: string
  city: string
  launchDate: string
  notify: boolean
}

export const FORM_CITY_OPTIONS = [
  { label: '上海', value: 'shanghai' },
  { label: '杭州', value: 'hangzhou' },
  { label: '成都', value: 'chengdu' }
]

export const FORM_MODEL: FormDemoModel = {
  name: '组件库升级',
  city: 'shanghai',
  launchDate: '2026-11-01',
  notify: true
}

export const FORM_EMPTY_MODEL: FormDemoModel = {
  name: '',
  city: '',
  launchDate: '',
  notify: true
}

export const FORM_PARTIAL_MODEL: FormDemoModel = {
  name: '',
  city: 'hangzhou',
  launchDate: '',
  notify: true
}

export const FORM_RULES = {
  name: [
    { required: true, message: '请输入项目名称' },
    { min: 4, message: '名称至少 4 个字符' }
  ],
  city: [{ required: true, message: '请选择所属城市' }],
  launchDate: [{ required: true, message: '请选择启动日期' }]
}
