# 项目知识图谱

> 由 `npm run knowledge:build` 从 `registry.mjs`、各组件 `spec.mjs`、profiles、文档、测试与脚本生成；不要手改。
> 当前 digest：`4da2779a8961cc28`（节点 3037 / 边 4237）。

## 快速检索

```bash
npm run knowledge:search -- "虚拟滚动"
npm run knowledge:search -- "table edge" --json
npm run knowledge:explain -- component:table
npm run knowledge:stats
```

节点 id 约定：`component:<id>`、`export:<component>.<export>`、`feature:<component>.<feature>`、`profile:<name>`、`doc:<file>#<section>`、`test:<path>`、`command:npm:<name>`。

## 组件索引

| 组件 | 说明 | 导出 | 特性 |
| --- | --- | --- | --- |
| `affix` | 对齐主流组件库的 Affix，基础 props 与可选特性拆分。 | 1 | 0 |
| `alert` | 对齐主流组件库的 Alert，基础 props 与可选特性拆分。 | 1 | 2 |
| `anchor` | 对齐主流组件库的 Anchor / AnchorLink，基础 props 与可选特性拆分。 | 2 | 1 |
| `autocomplete` | 对齐主流组件库的 Autocomplete，基础 props 与可选特性拆分。 | 1 | 6 |
| `avatar` | 对齐主流组件库的 Avatar / AvatarGroup，基础 props 与可选特性拆分。 | 2 | 2 |
| `backtop` | 滚动超过阈值后浮现的回到顶部按钮，可指定滚动容器与右下偏移。 | 1 | 0 |
| `badge` | 对齐主流组件库的 Badge，基础 props 与可选特性拆分。 | 1 | 1 |
| `breadcrumb` | 对齐主流组件库的 Breadcrumb / BreadcrumbItem，基础 props 与可选特性拆分。 | 2 | 0 |
| `button` | 对齐主流组件库的 Button / ButtonGroup，基础交互与外观、加载、图标、背景色等特性拆分。 | 2 | 6 |
| `calendar` | 对齐主流组件库的 Calendar，基础 props 与可选特性拆分。 | 1 | 1 |
| `card` | 对齐主流组件库的 Card，基础 props 与可选特性拆分。 | 1 | 1 |
| `carousel` | 对齐主流组件库的 Carousel / CarouselItem，基础 props 与可选特性拆分。 | 2 | 1 |
| `cascader` | 对齐主流组件库的 Cascader，基础 props 与可选特性拆分。 | 1 | 8 |
| `cascader-panel` | 对齐主流组件库的 CascaderPanel，基础 props 与可选特性拆分。 | 1 | 5 |
| `check-tag` | 对齐主流组件库的 CheckTag，基础 props 与可选特性拆分。 | 1 | 0 |
| `checkbox` | 对齐主流组件库的 Checkbox / CheckboxButton / CheckboxGroup，基础 props 与可选特性拆分。 | 3 | 1 |
| `col` | 对齐主流组件库的 Col，基础 props 与可选特性拆分。 | 1 | 1 |
| `collapse` | 对齐主流组件库的 Collapse / CollapseItem，基础 props 与可选特性拆分。 | 2 | 1 |
| `collapse-transition` | 对齐主流组件库的 CollapseTransition，基础 props 与可选特性拆分。 | 1 | 0 |
| `collection` | 对齐主流组件库的 Collection / CollectionItem，为内部组件提供子项实例注册与查询。 | 2 | 0 |
| `color-picker` | 对齐主流组件库的 ColorPicker，基础 props 与可选特性拆分。 | 1 | 3 |
| `color-picker-panel` | 对齐主流组件库的 ColorPickerPanel，基础 props 与可选特性拆分。 | 1 | 1 |
| `config-provider` | 对齐主流组件库的 ConfigProvider，基础 props 与可选特性拆分。 | 1 | 0 |
| `container` | 对齐主流组件库的 Aside / Container / Footer / Header / Main，基础 props 与可选特性拆分。 | 5 | 0 |
| `countdown` | 对齐主流组件库的 Countdown，基础 props 与可选特性拆分。 | 1 | 0 |
| `date-picker` | 对齐主流组件库的 DatePicker，基础 props 与可选特性拆分。 | 1 | 6 |
| `date-picker-panel` | 对齐主流组件库的 DatePickerPanel，基础 props 与可选特性拆分。 | 1 | 4 |
| `descriptions` | 对齐主流组件库的 Descriptions / DescriptionsItem，基础 props 与可选特性拆分。 | 2 | 1 |
| `dialog` | 对齐主流组件库的 Dialog，基础 props 与可选特性拆分。 | 1 | 5 |
| `divider` | 对齐主流组件库的 Divider，基础 props 与可选特性拆分。 | 1 | 0 |
| `drawer` | 对齐主流组件库的 Drawer，基础 props 与可选特性拆分。 | 1 | 5 |
| `dropdown` | 对齐主流组件库的 Dropdown / DropdownItem / DropdownMenu，基础 props 与可选特性拆分。 | 3 | 2 |
| `empty` | 对齐主流组件库的 Empty，基础 props 与可选特性拆分。 | 1 | 0 |
| `focus-trap` | 对齐主流组件库的 FocusTrap，基础 props 与可选特性拆分。 | 1 | 0 |
| `form` | 对齐主流组件库的 Form / FormItem，基础 props 与可选特性拆分。 | 2 | 2 |
| `icon` | 统一图标入口：内置 lucide 图标按语义名管理，支持传入组件或注册的自定义图标。 | 1 | 0 |
| `image` | 对齐主流组件库的 Image，基础 props 与可选特性拆分。 | 1 | 3 |
| `image-viewer` | 对齐主流组件库的 ImageViewer，基础 props 与可选特性拆分。 | 1 | 2 |
| `infinite-scroll` | 对齐主流组件库的 InfiniteScroll，基础 props 与可选特性拆分。 | 1 | 0 |
| `input` | 对齐主流组件库的 Input，基础 props 与可选特性拆分。 | 1 | 5 |
| `input-number` | 对齐主流组件库的 InputNumber，基础 props 与可选特性拆分。 | 1 | 1 |
| `input-otp` | 对齐主流组件库的 InputOtp，基础 props 与可选特性拆分。 | 1 | 0 |
| `input-tag` | 对齐主流组件库的 InputTag，基础 props 与可选特性拆分。 | 1 | 3 |
| `link` | 对齐主流组件库的 Link，基础 props 与可选特性拆分。 | 1 | 2 |
| `loading` | 对齐主流组件库的 Loading，基础 props 与可选特性拆分。 | 1 | 0 |
| `mention` | 对齐主流组件库的 Mention，基础 props 与可选特性拆分。 | 1 | 5 |
| `menu` | 对齐主流组件库的 Menu / MenuItem / MenuItemGroup / SubMenu，基础 props 与可选特性拆分。 | 4 | 1 |
| `message` | 对齐主流组件库的 Message，基础 props 与可选特性拆分。 | 1 | 4 |
| `message-box` | 对齐主流组件库的 MessageBox，基础 props 与可选特性拆分。 | 1 | 1 |
| `notification` | 对齐主流组件库的 Notification，基础 props 与可选特性拆分。 | 1 | 3 |
| `overlay` | 对齐主流组件库的 Overlay，基础 props 与可选特性拆分。 | 1 | 0 |
| `page-header` | 对齐主流组件库的 PageHeader，基础 props 与可选特性拆分。 | 1 | 1 |
| `pagination` | 对齐主流组件库的 Pagination，基础 props 与可选特性拆分。 | 1 | 2 |
| `popconfirm` | 对齐主流组件库的 Popconfirm，基础 props 与可选特性拆分。 | 1 | 2 |
| `popover` | 对齐主流组件库的 Popover，基础 props 与可选特性拆分。 | 1 | 1 |
| `popper` | 对齐主流组件库的 Popper / PopperArrow / PopperContent / PopperTrigger，基础 props 与可选特性拆分。 | 4 | 0 |
| `progress` | 对齐主流组件库的 Progress，基础 props 与可选特性拆分。 | 1 | 0 |
| `radio` | 对齐主流组件库的 Radio / RadioButton / RadioGroup，基础 props 与可选特性拆分。 | 3 | 1 |
| `rate` | 对齐主流组件库的 Rate，基础 props 与可选特性拆分。 | 1 | 1 |
| `roving-focus-group` | 对齐主流组件库的 RovingFocusGroup / RovingFocusItem，基础 props 与可选特性拆分。 | 2 | 0 |
| `row` | 对齐主流组件库的 Row，基础 props 与可选特性拆分。 | 1 | 0 |
| `scrollbar` | 对齐主流组件库的 Scrollbar 实现，自定义 wrap/view、双向滑块、拖拽与原生滚动回退。 | 1 | 1 |
| `segmented` | 对齐主流组件库的 Segmented，基础 props 与可选特性拆分。 | 1 | 0 |
| `select` | 对齐主流组件库的 Option / OptionGroup / Select，基础 props 与可选特性拆分。 | 3 | 9 |
| `skeleton` | 对齐主流组件库的 Skeleton / SkeletonItem，基础 props 与可选特性拆分。 | 2 | 1 |
| `slider` | 对齐主流组件库的 Slider，基础 props 与可选特性拆分。 | 1 | 3 |
| `slot` | 对齐主流组件库的 OnlyChild，基础 props 与可选特性拆分。 | 1 | 0 |
| `space` | 对齐主流组件库的 Space，基础 props 与可选特性拆分。 | 1 | 0 |
| `splitter` | 对齐主流组件库的 Splitter / SplitterPanel，基础 props 与可选特性拆分。 | 2 | 2 |
| `statistic` | 对齐主流组件库的 Statistic，基础 props 与可选特性拆分。 | 1 | 1 |
| `steps` | 对齐主流组件库的 Step / Steps，基础 props 与可选特性拆分。 | 2 | 1 |
| `switch` | 对齐主流组件库的 Switch，基础 props 与可选特性拆分。 | 1 | 2 |
| `table` | 单表结构渲染，纯 CSS sticky 冻结列，支持排序、多列排序、树形、合并单元格、列宽拖拽、加载态、选择与汇总。 | 2 | 9 |
| `tabs` | 对齐主流组件库的 TabPane / Tabs，基础 props 与可选特性拆分。 | 2 | 5 |
| `tag` | 对齐主流组件库的 Tag，基础 props 与可选特性拆分。 | 1 | 2 |
| `text` | 对齐主流组件库的 Text，基础 props 与可选特性拆分。 | 1 | 0 |
| `time-picker` | 对齐主流组件库的 TimePicker，基础 props 与可选特性拆分。 | 1 | 6 |
| `time-select` | 对齐主流组件库的 TimeSelect，基础 props 与可选特性拆分。 | 1 | 5 |
| `timeline` | 对齐主流组件库的 Timeline / TimelineItem，基础 props 与可选特性拆分。 | 2 | 0 |
| `tooltip` | 对齐主流组件库的 Tooltip，基础 props 与可选特性拆分。 | 1 | 2 |
| `tour` | 对齐主流组件库的 Tour / TourStep，基础 props 与可选特性拆分。 | 2 | 7 |
| `transfer` | 对齐主流组件库的 Transfer，基础 props 与可选特性拆分。 | 1 | 1 |
| `tree` | 对齐主流组件库的 Tree，基础 props 与可选特性拆分。 | 1 | 5 |
| `tree-select` | 对齐主流组件库的 TreeSelect，基础 props 与可选特性拆分。 | 1 | 3 |
| `upload` | 对齐主流组件库的 Upload，基础 props 与可选特性拆分。 | 1 | 2 |
| `virtual-list` | 对齐主流组件库的 VirtualList，固定行高窗口化渲染，支持缓存区与自定义 item key。 | 1 | 0 |
| `watermark` | 对齐主流组件库的 Watermark，基础 props 与可选特性拆分。 | 1 | 1 |

## profile

| id | 标签 | 组件范围 | 前缀 |
| --- | --- | --- | --- |
| `profile:antd` | Ant Design | full | antd |
| `profile:arco` | Arco Design | full | arco |
| `profile:bootstrap` | Bootstrap | full | bootstrap |
| `profile:branded` | Branded 品牌主题 | full | acme |
| `profile:carbon` | Carbon IBM | full | carbon |
| `profile:chinese` | Chinese 中国风 | full | chinese |
| `profile:core` | Core 基础包 | all |  |
| `profile:cute` | Cute 可爱主题 | full | cute |
| `profile:fluent` | Fluent 2 微软 | full | fluent |
| `profile:full` | Full 全特性 | full |  |
| `profile:ios` | iOS 苹果 | full | ios |
| `profile:mantine` | Mantine | full | mantine |
| `profile:material3` | Material 3 谷歌 | full | material3 |
| `profile:naive` | Naive UI | full | naive |
| `profile:semi` | Semi Design | full | semi |
| `profile:shadcn` | shadcn/ui | full | shadcn |
| `profile:tdesign` | TDesign 腾讯 | full | tdesign |
| `profile:vant` | Vant 移动端 | full | vant |
| `profile:varlet` | Varlet 移动端 | full | varlet |
| `profile:viewui` | View Design (iView) | full | viewui |

## 文档

- `AGENTS.md`：> 本文件是 agent 的入口契约；权威规则集是 [RULES.md](RULES.md)，冲突时以 RULES.md 为准。
- `AOCI.md`：> **读者**：AI Agent。照着本文做完，AOCI 就装好了、本项目就接好了。
- `CHANGELOG.md`：版本号的唯一事实源是根目录 `package.json`：`registry.mjs` 与每份 `dist/<profile>/package.json` 都从它读取，不另行手写。
- `KNOWLEDGE.md`：面向后续维护者（含 AI 助手）的上下文交接文档。配合 `REQUIREMENTS.md` 阅读。
- `NAMING.md`：> 适用范围：`packages/ui-kit/src/components/` 下全部组件的 props / emits / 类名。
- `OPTIMIZATION_PLAN_V2.md`：> 基线：本地 `main @ be5cd47`（十三段门禁全绿）；`origin/main` 领先 2 个提交（第十二批：虚拟列表统一），开工前先 `fetch` + `--ff-only` 同步。
- `OPTIMIZATION_PLAN_V3.md`：> 基线：`main@f83f0bf`（2026-11-08，`npm run quality` 十三段全绿，`ci-report.json` 无跳过阶段）。
- `OPTIMIZATION_PLAN.md`：> 基线：`origin/main @ c415f1e`（十二段门禁全绿，组件层 95 文件 1582 条、构建器侧 8 文件 95 条、profile 运行时 142 条、浏览器层 11 文件 65 条）。
- `QODER.md`：本项目 agent 契约以 [AGENTS.md](AGENTS.md) 为唯一入口（Qoder 与所有 AGENTS.md 兼容工具共用一份，避免双份漂移）。
- `README.md`：基于 Vue 3 + TypeScript 的 UI 组件库按需构建方案：一份源码树，通过 profile 配置按「组件 × 特性」粒度裁剪产物，输出为一个个可独立安装的 npm 包，并配套 20 套主题与可视化构建器、组件调试台。
- `REQUIREMENTS.md`：| 章节        | 标题                                                                                                      |
- `RULES.md`：> 本文件是唯一权威规则集。换 IDE、换机器、换 agent，规矩不变。
- `WORKFLOW.md`：多 agent / 多开发者在各自的 git worktree 里并行改同一份仓库。本手册约定怎么认领任务、

