export const SELECT_CITY_OPTIONS = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' },
  { label: '深圳', value: 'shenzhen' },
  { label: '杭州', value: 'hangzhou' },
  { label: '南京', value: 'nanjing' },
  { label: '苏州', value: 'suzhou' },
  { label: '成都', value: 'chengdu' },
  { label: '重庆', value: 'chongqing' },
  { label: '武汉', value: 'wuhan' },
  { label: '西安', value: 'xian' },
  { label: '长沙', value: 'changsha' },
  { label: '青岛', value: 'qingdao' },
  { label: '厦门', value: 'xiamen' },
  { label: '昆明', value: 'kunming' },
  { label: '天津', value: 'tianjin' },
  { label: '郑州', value: 'zhengzhou' },
  { label: '合肥', value: 'hefei' }
]

export const SELECT_VIRTUAL_10K_OPTIONS = Array.from({ length: 10000 }, (_, index) => ({
  label: `选项 ${index + 1}`,
  value: index + 1
}))
