interface CascaderOption {
  value: string
  label: string
  leaf?: boolean
  children?: CascaderOption[]
}

interface LazyNodeContext {
  level: number
  value?: string
  label?: string
  pathValues?: string[]
  pathLabels?: string[]
  root?: boolean
}

const PROVINCES: { value: string; label: string; cities: { value: string; label: string; districts: string[] }[] }[] = [
  {
    value: 'zhejiang',
    label: '浙江省',
    cities: [
      { value: 'hangzhou', label: '杭州市', districts: ['西湖区', '滨江区', '余杭区'] },
      { value: 'ningbo', label: '宁波市', districts: ['海曙区', '鄞州区', '镇海区'] },
      { value: 'wenzhou', label: '温州市', districts: ['鹿城区', '瓯海区', '龙湾区'] }
    ]
  },
  {
    value: 'jiangsu',
    label: '江苏省',
    cities: [
      { value: 'nanjing', label: '南京市', districts: ['鼓楼区', '玄武区', '建邺区'] },
      { value: 'suzhou', label: '苏州市', districts: ['姑苏区', '吴中区', '相城区'] },
      { value: 'wuxi', label: '无锡市', districts: ['梁溪区', '滨湖区', '新吴区'] }
    ]
  },
  {
    value: 'guangdong',
    label: '广东省',
    cities: [
      { value: 'guangzhou', label: '广州市', districts: ['天河区', '越秀区', '海珠区'] },
      { value: 'shenzhen', label: '深圳市', districts: ['南山区', '福田区', '罗湖区'] },
      { value: 'foshan', label: '佛山市', districts: ['禅城区', '南海区', '顺德区'] }
    ]
  },
  {
    value: 'sichuan',
    label: '四川省',
    cities: [
      { value: 'chengdu', label: '成都市', districts: ['武侯区', '锦江区', '青羊区'] },
      { value: 'mianyang', label: '绵阳市', districts: ['涪城区', '游仙区', '安州区'] },
      { value: 'deyang', label: '德阳市', districts: ['旌阳区', '罗江区', '广汉市'] }
    ]
  }
]

const PROVINCE_CODES: Record<string, string> = {
  zhejiang: 'zj',
  jiangsu: 'js',
  guangdong: 'gd',
  sichuan: 'sc'
}

export const CASCADER_OPTIONS: CascaderOption[] = PROVINCES.map((province) => ({
  value: province.value,
  label: province.label,
  children: province.cities.map((city) => ({
    value: city.value,
    label: city.label,
    children: city.districts.map((district, index) => ({
      value: `${PROVINCE_CODES[province.value]}-${city.value}-${index + 1}`,
      label: district
    }))
  }))
}))

export const CASCADER_MULTIPLE_VALUE: string[][] = [
  ['zhejiang', 'hangzhou', 'zj-hangzhou-1'],
  ['jiangsu', 'nanjing', 'js-nanjing-1'],
  ['guangdong', 'shenzhen', 'gd-shenzhen-1'],
  ['sichuan', 'chengdu', 'sc-chengdu-1']
]

export const CASCADER_DEFAULT_CLEAR_PATH: string[] = ['zhejiang', 'hangzhou', 'zj-hangzhou-1']

export function cascaderValueOnClear(): string[] {
  return [...CASCADER_DEFAULT_CLEAR_PATH]
}

const BIG_CITY_NAMES = ['中心区', '高新区', '临港区']

export const CASCADER_BIG_OPTIONS: CascaderOption[] = Array.from({ length: 400 }, (_value, index) => {
  const region = index + 1
  return {
    value: `region-${region}`,
    label: `区域 ${String(region).padStart(3, '0')} 号`,
    children: BIG_CITY_NAMES.map((city, cityIndex) => ({
      value: `region-${region}-city-${cityIndex + 1}`,
      label: `区域 ${region} · ${city}`,
      children: [
        {
          value: `region-${region}-city-${cityIndex + 1}-grid-a`,
          label: `网格 ${region}-${cityIndex + 1}-A`
        },
        {
          value: `region-${region}-city-${cityIndex + 1}-grid-b`,
          label: `网格 ${region}-${cityIndex + 1}-B`
        }
      ]
    }))
  }
})

const LAZY_REGIONS = ['华东', '华南', '华北', '西南', '西北', '东北', '华中', '港澳台']
const LAZY_CITY_NAMES = ['中心城区', '高新区', '临港新区', '空港新区', '经开区', '滨江新区']
const LAZY_STREETS = ['中山路街道', '解放路街道', '人民路街道', '科技园街道']

const LAZY_DELAY = 550

function lazyRegions(): CascaderOption[] {
  return LAZY_REGIONS.map((label, index) => ({
    value: `lazy-region-${index + 1}`,
    label: `${label}大区`,
    leaf: false
  }))
}

function lazyCities(regionValue: string): CascaderOption[] {
  return LAZY_CITY_NAMES.map((name, index) => ({
    value: `${regionValue}-city-${index + 1}`,
    label: name,
    leaf: false
  }))
}

function lazyStreets(cityValue: string): CascaderOption[] {
  return LAZY_STREETS.map((name, index) => ({
    value: `${cityValue}-street-${index + 1}`,
    label: name,
    leaf: true
  }))
}

export function lazyLoadCascader(node: LazyNodeContext, resolve: (children: CascaderOption[]) => void): void {
  const regionValue = node.pathValues?.[0] ?? ''
  setTimeout(() => {
    if (node.level === 0) {
      resolve(lazyRegions())
      return
    }
    if (node.level === 1) {
      resolve(lazyCities(regionValue))
      return
    }
    const cityValue = node.value ?? ''
    resolve(lazyStreets(cityValue))
  }, LAZY_DELAY)
}
