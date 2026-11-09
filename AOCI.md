# AOCI 安装与接入手册（AI 直接执行）

> **读者**：AI Agent。照着本文做完，AOCI 就装好了、本项目就接好了。
> **目标**：安装 `aoci` → 初始化本仓库 → 配好 MCP，全程不需要用户提供路径或手工编辑文件。
> **版本基线**：`aoci 0.1.0-rc23`。本文所有命令均在该版本实测。

---

## 0. 先判断要不要装（30 秒）

```powershell
aoci --version
```

| 结果 | 含义 | 下一步 |
| --- | --- | --- |
| 输出版本号 | 已在 PATH 上 | 跳到第 2 节 |
| 报「无法将"aoci"项识别为…」 | **没装，或没进 PATH** | 继续第 1 节 |
| 输出版本号但低于 `0.1.0-rc23` | 版本过旧 | 按第 1 节重装 |

> 没进 PATH 不影响使用。MCP 配置里写**绝对路径**即可，不需要改系统环境变量。

---

## 1. 安装

### 1.1 下载对应平台的发布包

发布页：`https://github.com/aoci-spec/aoci-code/releases`

平台与包名对照（以发布页实际文件名为准）：

| 系统 | 架构 | 包名形如 |
| --- | --- | --- |
| Windows | x64 | `aoci_0.1.0-rc23_windows_amd64.zip` |
| macOS | Apple Silicon | `aoci_0.1.0-rc23_darwin_arm64.tar.gz` |
| macOS | Intel | `aoci_0.1.0-rc23_darwin_amd64.tar.gz` |
| Linux | x64 | `aoci_0.1.0-rc23_linux_amd64.tar.gz` |
| Linux | ARM64 | `aoci_0.1.0-rc23_linux_arm64.tar.gz` |

**方式一：GitHub CLI（推荐，能取到校验资产）**

```powershell
gh auth login
gh release download v0.1.0-rc23 --repo aoci-spec/aoci-code
```

**方式二：直接下载（无 gh 时）**

```powershell
$ver = "v0.1.0-rc23"
$asset = "aoci_0.1.0-rc23_windows_amd64.zip"
Invoke-WebRequest -Uri "https://github.com/aoci-spec/aoci-code/releases/download/$ver/$asset" -OutFile $asset
```

### 1.2 校验完整性

发布页同时提供 `SHA256SUMS`：

```powershell
Get-FileHash .\aoci_0.1.0-rc23_windows_amd64.zip -Algorithm SHA256
# 与 SHA256SUMS 中对应行逐字节比对，不一致立即停止，不要解压
```

### 1.3 解压到稳定绝对路径

```powershell
New-Item -ItemType Directory -Force -Path 'D:\tools\aoci' | Out-Null
Expand-Archive -Path .\aoci_0.1.0-rc23_windows_amd64.zip -DestinationPath 'D:\tools\aoci' -Force
```

放置原则：

| 要求 | 原因 |
| --- | --- |
| **稳定绝对路径**（如 `D:\tools\aoci\aoci.exe`） | MCP 配置与 `init` 都按绝对路径记录，移动后全部失效 |
| **不要放项目目录内** | 会被 `aoci scan` 当作仓库资产扫进去 |
| **不要放临时/下载目录** | 清理工具会删掉 |
| 不必加入 PATH | MCP 用绝对路径调用 |

### 1.4 验证

```powershell
& 'D:\tools\aoci\aoci.exe' --version
```

必须看到：

```text
aoci version 0.1.0-rc23 (commit ..., built ...)
```

看不到就回到 1.2，不要继续。

---

## 2. 初始化本仓库

在**仓库根目录**执行：

```powershell
& 'D:\tools\aoci\aoci.exe' --repo '<仓库根绝对路径>' init --agent qoder --locale zh-CN --scope-profile production
```

参数：

| 参数 | 取值 | 怎么选 |
| --- | --- | --- |
| `--agent` | `qoder` / `claude` / `codex` / `cursor` / `opencode` / `all` | **填当前宿主**，决定 MCP 配置写到哪里 |
| `--locale` | `zh-CN` / `en-US` | 索引条目用哪种语言写；跟仓库文档语言一致 |
| `--scope-profile` | `production` / `full` / `custom` | 默认 `production`；`full` 索引更多边缘文件 |
| `--hooks` | 开关 | 安装宿主生命周期 hook，非必需 |
| `--here` | 开关 | 自动定位仓库失败时才加 |

`init` 会做三件事：

1. 生成索引骨架：`aoci.txt`、`aoci.meta.txt`、`.aoci/`（含 `config.json`）
2. **写入宿主 MCP 配置**（见第 3 节）
3. **修改 `AGENTS.md`**，追加 AOCI 接入规则

紧接着建立基线：

```powershell
& 'D:\tools\aoci\aoci.exe' --repo '<仓库根绝对路径>' scan
```

`scan` 按 git 的忽略规则取文件。**这一点很关键**：`aoci.txt`、`aoci.meta.txt`、`aoci.code.txt` 一旦被 `.gitignore` 忽略，
`scan` 会静默跳过它们，索引就建不起来。见第 6 节。

---

## 3. MCP 配置

### 3.1 `init` 已经自动写好了

`--agent` 填谁，配置就写到哪里：

| 宿主 | `--agent` | 配置文件 | 说明 |
| --- | --- | --- | --- |
| Qoder | `qoder` | `.mcp.json` | 项目级 stdio MCP |
| Claude Code | `claude` | `.mcp.json` + `.claude/settings.json` | 可选 `PreToolUse` hook |
| Codex | `codex` | `.codex/config.toml` | 可选 `--hooks`，需在 `/hooks` 中审查信任 |
| OpenCode | `opencode` | `opencode.json` | 严格项目级配置 |
| Cursor | `cursor` | **不写文件** | 只返回配置片段，需手工粘贴 |

**不需要手写。** 先检查 `init` 有没有生成对应文件：

```powershell
Test-Path .mcp.json
Get-Content .mcp.json
```

内容应形如：

```json
{
  "mcpServers": {
    "aoci": {
      "command": "D:\\tools\\aoci\\aoci.exe",
      "args": ["--repo", "<仓库根绝对路径>", "mcp"]
    }
  }
}
```

### 3.2 只有一种情况需要手工补写

宿主是 Cursor，或 `init` 没有生成配置文件时，手工创建 `.mcp.json`：

```json
{
  "mcpServers": {
    "aoci": {
      "command": "D:\\tools\\aoci\\aoci.exe",
      "args": ["--repo", "D:\\full\\path\\to\\your\\repo", "mcp"]
    }
  }
}
```

两条硬性要求：

- `command` 用**绝对路径**；
- `args` 里**必须有 `--repo`**，漏掉它服务会绑定到 exe 所在目录，索引会写到别处去。

### 3.3 让配置生效

MCP 服务在宿主**启动时**加载，`init` 刚写入的配置在当前会话里还不存在。处理方式：

1. 先检查当前会话的 MCP 工具列表里有没有 AOCI 工具；
2. 没有 → **告知用户重启 Agent / 刷新 MCP 服务**，这是宿主加载机制，无法用命令绕过；
3. 支持动态加载的宿主可能无需重启，以工具列表实际出现为准。

### 3.4 接入自检（三条全过才算接好）

```text
1. 工具列表里出现 aoci_rules / aoci_overview / aoci_maintain 等
2. 调 aoci_rules 能返回合同正文
3. 返回体里的 runtime_repository_root == git rev-parse --show-toplevel
```

第 3 条不过，说明 `--repo` 写错了或连到了别的实例，回到 3.2。

---

## 4. 建立索引

**Volumes v1 布局下，索引只能由 MCP 工具创作。** CLI 的 `aoci index agent plan / stage` 会直接报：

```text
该命令或兼容写入路径不支持修改Volumes v1正式认知
```

所以建索引的前提是第 3 节已通过。

按顺序调用：

```text
aoci_rules      读一次合同（本认知周期不要重复调）
aoci_overview   跟 next_cursor 读到 completed = true
aoci_maintain   领一批候选（含 batch_id / candidate_id / source_sha256 / expected_e）
（读候选源码，创作 F / R / A / S 与四位 Tag）
aoci_update_entry  整批提交，code_batch_id = code_plan.batch_id
（remaining 不为 0 就回到 aoci_maintain，不要问用户要不要继续）
```

条目格式：

```text
文件名[Tag]: F:职责 | R:关系 | A:锚点 | S:非显然约束
```

Tag 是四位：`层 + 模块 + 重要度 + 规模`。层和模块的完整字典调 `aoci_header` 取，不要凭记忆写。
`S` 只写「不知道就会写错」的约束，看一眼代码就能知道的不写。

提交后被判 `repair_required` 时，只修 `findings` 命中的字段，其余保持原样，重提**同一完整批次**。

---

## 5. 完成判据

```powershell
& 'D:\tools\aoci\aoci.exe' --repo '<仓库根>' status
& 'D:\tools\aoci\aoci.exe' --repo '<仓库根>' verify
& 'D:\tools\aoci\aoci.exe' --repo '<仓库根>' check
```

三条同时成立才算完成：

```text
□ aoci_maintain 返回 remaining = 0
□ status / verify / check 无对齐阻断
□ 返回 refresh_status = refresh_ready_for_overview
```

可选：后台起一个只读面板把链接给用户：

```powershell
& 'D:\tools\aoci\aoci.exe' --repo '<仓库根>' ui --detach --json
```

---

## 6. `.gitignore` 怎么配（这里有个坑）

`init` 会自动把**宿主配置**写进 `.gitignore`（`.mcp.json` 等），因为这些文件含本机绝对路径，
换机器必然失效。这部分保持原样即可。

但以下四个**不能**加进 `.gitignore` 或 `.git/info/exclude`：

```text
aoci.txt
aoci.meta.txt
aoci.code.txt
AGENTS.md
```

原因（官方 README 原文）：

> scan 按 git 的忽略权威取文件，所以不要把 init 写入的认知资产（aoci.txt、aoci.meta.txt、
> aoci.code.txt、AGENTS.md）加进 .gitignore 或 .git/info/exclude —— 被忽略的会被静默跳过，索引建不起来。

`.aoci/` 目录不需要额外处理：它自带 [`.aoci/.gitignore`](.aoci/.gitignore)，默认全忽略，
只放行 `config.json`、`baseline.json`、`curation.json` 等治理资产。

如果用户希望「别人 clone 下来不带索引」，正确做法是在 `.gitignore` 里**显式放行**这些资产
（而不是忽略），交由用户决定是否提交；忽略会造成索引无法建立，属于故障而非配置。

---

## 7. 故障速查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `无法将"aoci"项识别为…` | 没装或没进 PATH | 用绝对路径调用，见 1.3 |
| 工具列表里没有 AOCI 工具 | MCP 未加载 | 重启宿主，见 3.3 |
| `not found MCPHost severName: ...` | 配置文件缺失或服务被卸载 | 检查 `.mcp.json`，重启宿主 |
| 索引写到了别的仓库 | 少了 `--repo`，或连到同名实例 | 核对 `runtime_repository_root`，见 3.2 |
| `该命令…不支持修改Volumes v1正式认知` | 用了 Legacy CLI 通路 | 改用 MCP 工具，见第 4 节 |
| `aoci scan` 后条目数为 0 | 三卷被 git 忽略 | 见第 6 节，移除忽略规则后重跑 |
| 版本低于 `0.1.0-rc23` | 旧包 | 按第 1 节重装 |

---

## 8. 一句话总结

```text
下载解压到 D:\tools\aoci  →  init --agent <宿主>  →  scan  →  重启宿主  →  用 MCP 工具建索引
```

安装、初始化、写配置三步全部可脚本化，不需要用户动手。
唯一需要人的环节是宿主重载 MCP，这是加载机制决定的，不是配置没做对。
