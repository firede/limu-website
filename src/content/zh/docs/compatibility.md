---
title: "兼容性"
description: "支持的图表类型，以及 limu 与 Pele 和 Mermaid 的差异。"
---

limu-rs 和 limu 解析 Mermaid 文本的方式与 [Pele](https://pele.run) 1.13.0 相同，得到的布局逐个数值一致。limu 与 Mermaid 不同的地方，几乎都是因为 Pele 本身就与 Mermaid 不同。

## 图表类型 {#diagram-types}

Pele 能画的图表类型 limu 都支持，涵盖 Mermaid 12.1.0 内置的所有类型。[示例](/examples)展示了每一种。

| 类型 | 关键字 |
| --- | --- |
| 流程图 | `graph`, `flowchart` |
| 泳道图 | `swimlane-beta` |
| 时序图 | `sequenceDiagram` |
| 类图 | `classDiagram` |
| 状态图 | `stateDiagram`, `stateDiagram-v2` |
| 实体关系图 | `erDiagram` |
| 甘特图 | `gantt` |
| Git 图 | `gitGraph` |
| 饼图 | `pie` |
| 思维导图 | `mindmap` |
| 看板 | `kanban` |
| 时间线 | `timeline` |
| 用户旅程 | `journey` |
| 象限图 | `quadrantChart` |
| XY 图 | `xychart`, `xychart-beta` |
| 需求图 | `requirementDiagram` |
| 桑基图 | `sankey`, `sankey-beta` |
| 架构图 | `architecture-beta` |
| C4 | `C4Context`, `C4Container`, `C4Component`, `C4Dynamic`, `C4Deployment` |
| 块图 | `block`, `block-beta` |
| Agent 流程图 | `agentflow-beta` |
| 铁路图 | `railroad-beta`, `railroad-ebnf-beta`, `railroad-abnf-beta`, `railroad-peg-beta` |
| 树视图 | `treeView-beta` |
| Cynefin | `cynefin-beta` |
| Wardley 地图 | `wardley-beta` |
| 事件建模 | `eventmodeling` |
| 用例图 | `usecase-beta` |
| 韦恩图 | `venn-beta` |
| 石川图 | `ishikawa`, `ishikawa-beta` |
| 数据包图 | `packet`, `packet-beta` |
| 雷达图 | `radar-beta` |
| 矩形树图 | `treemap`, `treemap-beta` |
| 信息 | `info` |

不支持 ZenUML 和其他外部 Mermaid 插件。用 `rust:limu::supports` `go:limu.Supports` 检查 limu 是否支持某段文本的类型。

每种类型都支持 front matter、`%%{init}%%` 指令、注释，以及无障碍标题和描述（`accTitle`、`accDescr`）。每种类型遵从哪些配置项，与 Pele 相同。

## 与 Pele 的差异 {#differences-from-pele}

### Pele 的 API 在 limu 中的对应 {#peles-api-in-limu}

Pele 在浏览器中渲染 SVG，而 limu 布局出场景，交给后端绘制。因此 Pele 的选项分散在 limu 的各个阶段中。

<div data-lang-only="rust">

| Pele | limu-rs |
| --- | --- |
| `render(source, options)` | `limu::layout`，再调用 `svg::render` 等后端 |
| `parse(source, options)` | `limu::parse` |
| `supports` | `limu::supports` |
| `type`, `mermaidType` | `Diagram::diagram_type()`, `Diagram::mermaid_type()` |
| `PeleError` 及其错误码 | `limu::Error` 和 `ErrorCode` |
| `limit`, `maxEdges`, `config` | `limu::ParseOptions` |
| `measurer`, `fontSize`, `maxWidth`, `autoDirection`, `directionBreakpoint`, `padding`, `monospace`, `now` | `limu::layout::Options`，其中 `keep_direction` 与 `autoDirection` 含义相反 |
| `links`, `images`, `linkSchemes`, `imageSchemes` | `limu::layout::Options` 和 `svg::Options` |
| `fontFamily`, `fontFamilyMono` | `svg::Options` 的 `font_family` 和 `mono_family` |
| `icons` | `limu::layout::Options::icons`，加上 `svg::Options::icon_markup` 或原生后端的 icons |
| `--pele-*` 变量、`pele-*` 类名 | `--limu-*` 变量、`limu-*` 类名 |

</div>

<div data-lang-only="go">

| Pele | limu |
| --- | --- |
| `render(source, options)` | `limu.Layout`，再调用 `svg.Render` 等后端 |
| `parse(source, options)` | `limu.Parse` |
| `detectType`, `supports` | `diagram.DetectType`, `limu.Supports` |
| `type`, `mermaidType` | `Diagram.Type()`, `Diagram.MermaidType()` |
| `PeleError` 及其错误码 | `diagram.Error` 及其错误码 |
| `limit`, `maxEdges`, `config` | `diagram.Options` |
| `measurer`, `fontSize`, `maxWidth`, `autoDirection`, `directionBreakpoint`, `padding`, `monospace`, `now` | `layout.Options`，其中 `KeepDirection` 与 `autoDirection` 含义相反 |
| `links`, `images`, `linkSchemes`, `imageSchemes` | `layout.Options` 和 svg 包的 `Options` |
| `fontFamily`, `fontFamilyMono` | svg 包的 `FontFamily` 和 `MonoFamily` |
| `icons` | `layout.Options.Icons`，加上 svg 包的 `IconMarkup` 或 limumygo 的 `DrawIcon` |
| `--pele-*` 变量、`pele-*` 类名 | `--limu-*` 变量、`limu-*` 类名 |

</div>

只在浏览器中才有意义的功能没有移植。`mount` 及其缩放和 `refresh` 交给应用处理，应用可以用场景做到同样的事，比如通过原生后端选项中的缩放比例。SVG 选项 `responsive`、`idPrefix`、`linkRel`、`outputLimit` 和 `sanitize` 也没有移植。按需加载图表类型的入口同样没有移植。Rust 程序关闭它不读取的类型的 feature，Go 程序只链接它导入的内容。

Pele 的 `math` 选项没有移植。开启它时，Pele 会通过应用提供的函数排版标签中的 `$$…$$`。不开启时，Pele 把标签保留为文本，limu 则始终如此。

### 绘制 {#drawing}

limu 有几处画法与 Pele 不同。

信息图显示的是 limu 的名称和版本，而不是 Pele 的。

Pele 会把作者设置的 `font-family`、`letter-spacing`、`word-spacing` 和 `text-decoration` 传给文本，在矩形树图和韦恩图中还会应用它测量文本时没有用到的字重或字号。limu 只读取字重、斜体和字号，而且只在布局用它们测量文本的地方才读取，因为绘制方式与测量方式不同的文本，会放不进布局为它留的空间。

Pele 把桑基图的标签和数值写成一段文本，数值用另一种颜色。limu 把它们拆成两个图元，按整体的宽度摆放。如果测量器会做字距调整，两者之间的间距可能与 Pele 略有不同。

主机名含非 ASCII 字符的链接会转换成 Punycode，但没有做完整的 UTS #46 映射，所以少数这样的主机名与 Node 的结果不同。

原生后端画出的图与 SVG 后端相同，除了各后端页面列出的少数差别，比如 [MyGo 的](/mygo#painting)。

limu-rs 和 limu 在每个平台上都得到相同的布局，它们的测试在 amd64 和 arm64 上都与 Pele 对照。

### 文本 {#text}

在浏览器中，Pele 用绘制时的字体测量文本。没有字体时，它使用一张 Arial 字符宽度表。limu 用你提供的测量器测量。默认测量器 `rust:limu::layout::Arial` `go:text.Arial` 就是这张表，所以使用它时，limu 的布局与 Pele 精确到最后一位。中文、日文和韩文的换行方式与 Pele 1.6 相同。参见[测量文本](/api#chinese-japanese-and-korean)。

## 与 Mermaid 的差异 {#differences-from-mermaid}

### 布局与外观 {#layout-and-appearance}

limu 按 Pele 的方式布局图表，这与 Mermaid 不同。节点位置、间距和边的路径都有差异。在 Mermaid 把图表交给外部库处理的地方，Pele 常常使用自己的布局。Mermaid 用力导向求解器布局架构图，Pele 则把它放在网格上，C4 图和块图也有自己的摆放和走线方式。

颜色来自 limu 的[主题](/theming)。Mermaid 的主题不起作用，在它的 `themeVariables` 中，limu 只读取设置系列色的[调色板](/theming#palettes)，与 Pele 相同。

### 尺寸 {#sizing}

能变窄的图表会变窄，以适应布局的最大宽度 `rust:max_width` `go:MaxWidth`。比如一张宽的流程图可能改为纵向排列。设置 `rust:keep_direction` `go:KeepDirection` 可以阻止这种变化。

### 子图 {#subgraphs}

与 Mermaid 相同，如果有边从子图内的节点连到子图外的节点，这个子图会沿用父级的方向。子图自己的 `direction` 只在没有边穿过其边界时生效。

### 限制 {#limits}

limu 限制图表文本的长度，以及流程图和 Agent 流程图中的边数。参见[限制](/api#limits)。

### 标签 {#labels}

标签支持换行、粗体和斜体，可以用 `<br>`、`<b>` 和 `<i>` 书写，也可以写成 Markdown 字符串。它们还能读取 `<code>`、`<sub>`、`<sup>` 和 `<u>`，以及 `<strong>`、`<em>`、`<kbd>`、`<ins>` 等同类标签。其他 HTML 标签会被去掉，只保留文字。形似标签、但 HTML 中并不存在的文本，比如 `List<T>` 中的类型，按原样显示。

### 交互 {#interaction}

打开链接的 `click` 会设置图元的链接，由你的应用决定是否跟随。调用函数的 `click` 会被忽略。

### 图标 {#icons}

`fa:fa-car` 这样的图标由你的应用提供。参见 [SVG](/svg#icons)，以及各个原生后端的页面，比如 [MyGo](/mygo#icons-and-images)。架构图和树视图还有内置的符号。

## 报告差异 {#reporting-differences}

如果 limu 或 limu-rs 解析或布局一张图表的结果与 Pele 不同，那是移植的 bug。在 limu 的 [Playground](/playground) 和 [Pele 的 Playground](https://pele.run/playground) 中分别打开这张图表，再把差异报告给 [limu](https://github.com/firede/limu/issues) 或 [limu-rs](https://github.com/firede/limu-rs/issues)。如果 Pele 画得一样，而两者都与 Mermaid 不同，就报告给 [Pele](https://github.com/obsidianmd/pele/issues)。
