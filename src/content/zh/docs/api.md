---
title: "API"
description: "解析和布局图表，设置限制，处理错误，读取场景。"
---

<div data-lang-only="rust">

limu-rs 分成几个 crate。`limu` 读取并布局图表，`limu-scene` 包含后端绘制所需的内容，每个后端各自是一个 crate。本页说明每个部分的用途和适用场景。[docs.rs](https://docs.rs/limu) 有每个名称的完整文档。

| crate 或模块 | 作用 |
| --- | --- |
| `limu` | 读取图表并完成布局。包含解析选项、图表类型和错误类型。 |
| `limu::layout` | 包含决定元素位置的选项。 |
| `limu::roles` | 为每种图表的每个部分命名角色。参见[主题](/theming)。 |
| `limu::scene` | 即 `limu-scene` crate。它把布局好的图表描述为一组图元，并包含所有后端共用的绘制逻辑。 |
| `limu::scene::text` | 测量文本，排布标签。 |
| `limu::scene::style` | 包含主题和覆盖。参见[主题](/theming)。 |
| `limu::scene::svg` | 把场景渲染成 SVG。参见 [SVG](/svg)。 |
| `limu-tiny-skia` | 把场景绘制到位图中。参见 [tiny-skia](/tiny-skia)。 |
| `limu-coregraphics` | 在 Apple 平台上用 Core Graphics 绘制场景。参见 [Core Graphics](/core-graphics)。 |
| `limu-gpui` | 在 GPUI 窗口中绘制场景。参见 [GPUI](/gpui)。 |
| `limu-ascii` | 把场景以文本形式绘制到终端的字符格中。参见[终端](/terminal)。 |

`limu` 和 `limu-scene` 只用到 Rust 标准库，以及可选 `serde` feature 背后的 `serde`。需要其他 crate 的后端各自独立成 crate，所以程序只会编译它用到的后端。

</div>

<div data-lang-only="go">

limu 分成几个包，图表绘制的每个阶段各一个。本页说明每个包的用途和适用场景。[pkg.go.dev](https://pkg.go.dev/github.com/firede/limu) 有每个名称的完整文档。

| 包 | 作用 |
| --- | --- |
| [`limu`](https://pkg.go.dev/github.com/firede/limu) | 读取图表并完成布局。 |
| [`diagram`](https://pkg.go.dev/github.com/firede/limu/diagram) | 包含解析选项、图表类型和错误类型。 |
| [`layout`](https://pkg.go.dev/github.com/firede/limu/layout) | 包含决定元素位置的选项。 |
| [`scene`](https://pkg.go.dev/github.com/firede/limu/scene) | 把布局好的图表描述为一组图元。 |
| [`text`](https://pkg.go.dev/github.com/firede/limu/text) | 测量文本，排布标签。 |
| [`style`](https://pkg.go.dev/github.com/firede/limu/style) | 包含主题和覆盖。参见[主题](/theming)。 |
| [`svg`](https://pkg.go.dev/github.com/firede/limu/svg) | 把场景渲染成 SVG。参见 [SVG](/svg)。 |
| [`limumygo`](https://pkg.go.dev/github.com/firede/limu/limumygo) | 用 MyGo 的原生 UI 绘制场景。它是一个独立的模块。参见 [MyGo](/mygo)。 |

除 `limumygo` 外，每个包都只用到 Go 标准库。

</div>

## 读取与布局 {#reading-and-laying-out}

<div data-lang-only="rust">

| 名称 | 作用 |
| --- | --- |
| `layout(src, o)` | 读取图表，并布局成场景。 |
| `parse(src, opt)` | 把图表读成 `Diagram`，留待之后布局。 |
| `Diagram::layout(o)` | 布局图表。可以用不同的选项调用多次，也可以在多个线程中同时调用。 |
| `Diagram::diagram_type()` | 返回图表的类型，比如 `DiagramType::Flowchart`。 |
| `Diagram::mermaid_type()` | 返回 Mermaid 对该类型的命名，比如 `graph TD` 对应 `flowchart-v2`。 |
| `Diagram::title()` | 返回图表 front matter 中给出的标题。 |
| `Diagram::config()` | 返回图表的配置，图表自身的设置覆盖解析时传入的设置。 |
| `types()` | 列出 limu 支持的图表类型，即 feature 已开启的那些。 |
| `supports(src)` | 报告 limu 是否支持文本声明的类型。它不解析其余部分，所以文本仍可能有错误。 |

</div>

<div data-lang-only="go">

| 名称 | 作用 |
| --- | --- |
| `Layout(src, o)` | 读取图表，并布局成场景。 |
| `Parse(src, opt)` | 把图表读成 `Diagram`，留待之后布局。 |
| `Diagram.Layout(o)` | 布局图表。可以用不同的选项调用多次，也可以在多个 goroutine 中同时调用。 |
| `Diagram.Type()` | 返回图表的类型，比如 `diagram.Flowchart`。 |
| `Diagram.MermaidType()` | 返回 Mermaid 对该类型的命名，比如 `graph TD` 对应 `flowchart-v2`。 |
| `Diagram.Config()` | 返回图表的配置，图表自身的设置覆盖解析时传入的设置。 |
| `Types()` | 列出 limu 支持的图表类型。 |
| `Supports(src)` | 报告 limu 是否支持文本声明的类型。它不解析其余部分，所以文本仍可能有错误。 |

</div>

布局一段文本，等同于先用默认选项解析，再布局得到的图表。如果同一张图表要布局不止一次，比如宽度变了，只解析一次即可。

## 解析 {#parsing}

解析选项 `rust:limu::ParseOptions` `go:diagram.Options` 设置文本的限制，以及一份配置，图表自身没有设置的地方就用它。

```rust
use limu::{Map, Value};

let flowchart = Map::from_iter([("curve", Value::from("linear"))]);
let d = limu::parse(
    src,
    &limu::ParseOptions {
        config: Map::from_iter([("flowchart", Value::from(flowchart))]),
        ..Default::default()
    },
)?;
```

```go
d, err := limu.Parse(src, diagram.Options{
	Config: diagram.Config{"flowchart": diagram.Config{"curve": "linear"}},
})
```

这里的配置和 Mermaid 的配置作用相同。图表也可以在 front matter 或 `%%{init: …}%%` 指令中设置配置，图表自身的设置逐个键覆盖传入的配置。值遵循 JSON。在 Rust 中，值是 `limu::Value`，对象是 `limu::Map`，键的顺序与 JavaScript 一致。在 Go 中，对象是 `diagram.Config`，数组是 `[]any`，数字是 `float64`。

### 限制 {#limits}

| 限制 | 默认值 | 选项 |
| --- | --- | --- |
| 文本长度 | 50,000 个 UTF-16 码元，即 Mermaid 的 `maxTextSize` | `rust:limit` `go:Limit` |
| 流程图或 Agent 流程图中的边数 | 5,000 | `rust:max_edges` `go:MaxEdges` |

超出限制的文本会返回错误码为 `rust:ErrorCode::Limit` `go:diagram.Limit` 的错误。在 Rust 中，设为 `None` 表示不限制。在 Go 中，设为负数表示不限制。对不可信的文本，保持默认值或调得更低。边数限制很重要，因为 `A & B --> C & D` 会成倍增加边数，几 KB 的文本就可能要求生成数百万条边。布局一旦开始，limu 就无法中止，限制是让它的工作量保持有界的手段。

### 错误 {#errors}

解析和布局返回的错误类型是 `rust:limu::Error` `go:*diagram.Error`，包含以下字段。

| 字段 | 内容 |
| --- | --- |
| `rust:code` `go:Code` | 错误的种类。 |
| `rust:message` `go:Message` | 对问题的描述，可能引用图表的文本。 |
| `rust:diagram` `go:Type` | 图表的类型，已知时才有。 |
| `rust:mermaid_type` `go:MermaidType` | Mermaid 对该类型的命名，已知时才有。 |
| `rust:line, column` `go:Line, Column` | 错误的位置，从 1 开始计数，列以 UTF-16 码元计。错误没有位置时两者都是 0。 |
| `rust:snippet` `go:Snippet` | 出错的那一行，以及位置下方的插入符号，有位置时才有。 |

| 错误码 | 含义 |
| --- | --- |
| `rust:ErrorCode::UnsupportedDiagram` `go:diagram.UnsupportedDiagram` | 文本不是 limu 支持的类型。 |
| `rust:ErrorCode::Syntax` `go:diagram.Syntax` | 文本无法解析。 |
| `rust:ErrorCode::Semantic` `go:diagram.Semantic` | 文本能解析，但要求了不可能的东西，比如不存在的形状。 |
| `rust:ErrorCode::Limit` `go:diagram.Limit` | 文本超出了限制，或者布局会得出非有限的数值，Pele 在这种地方会写出 NaN。 |

## 布局 {#layout}

布局选项 `rust:limu::layout::Options` `go:layout.Options` 包含所有影响元素位置的设置。改变这些选项需要重新布局，改变样式则不需要。在 Rust 中，`Options::default()` 给出默认值。在 Go 中，nil 选项等同于零值，每个字段取零值即表示默认。

<div data-lang-only="rust">

| 字段 | 默认值 | 作用 |
| --- | --- | --- |
| `measurer` | `&Arial` | 测量文本。参见[测量文本](#measuring-text)。 |
| `font_size` | 16 | 设置没有自身字号的文本的字号。 |
| `icons` | `None` | 报告你能否绘制某个图标，比如 `fa:fa-car`。标签只为你能绘制的图标留出空间。 |
| `max_width` | 无穷大 | 设置可用的宽度。能变窄的图表会变窄。 |
| `keep_direction` | false | 阻止横向排列的图表为适应 `max_width` 改为纵向排列。 |
| `direction_breakpoint` | 640 | 设置一个 `max_width` 阈值，低于它时图表才可能改变方向。 |
| `links`, `images` | true | 保留图表要求的链接和图片。设为 false 则丢弃它们。 |
| `link_schemes`, `image_schemes` | 见 [SVG](/svg#untrusted-diagrams) | 设置链接和图片在相对 URL 之外可以使用的 URL scheme。 |
| `padding` | `None`，即 8 | 设置图表四周的留白。 |
| `snap` | `None` | 把位置对齐到 `Grid`，供按整像素或按终端字符格绘制的后端使用。 |
| `routing` | `Routing::Auto` | 设置分层布局中边的走向。`Auto` 遵从文本，`Routing::Orthogonal` 和 `Routing::Straight` 会覆盖它。 |
| `monospace` | `Monospace::NONE` | 设置哪些部分使用等宽字体。`Monospace::MEMBERS` 对应类图的成员，`ATTRIBUTES` 对应实体关系图中属性的类型、名称和键，`FILES` 对应树视图的条目，`MESSAGES` 对应时序图的消息。作者为某个部分指定了字体时，保留作者的字体。 |
| `now` | `None`，即布局时的时间 | 设置甘特图的当前时间，用来标出今天，也作为没有开始日期的任务的开始时间。 |
| `time_zone` | `&Utc` | 设置甘特图读写日期所用的时区。Rust 标准库除 UTC 外不认识任何时区。`FixedOffset` 是 UTC 以东固定秒数的时区，需要真实时区的程序可以自己实现 `TimeZone`，比如借助 jiff。 |

</div>

<div data-lang-only="go">

| 字段 | 默认值 | 作用 |
| --- | --- | --- |
| `Measurer` | `text.Arial` | 测量文本。参见[测量文本](#measuring-text)。 |
| `FontSize` | 16 | 设置没有自身字号的文本的字号。 |
| `Icons` | 无 | 报告你能否绘制某个图标，比如 `fa:fa-car`。标签只为你能绘制的图标留出空间。 |
| `MaxWidth` | 不限 | 设置可用的宽度。能变窄的图表会变窄。 |
| `KeepDirection` | false | 阻止横向排列的图表为适应 `MaxWidth` 改为纵向排列。 |
| `DirectionBreakpoint` | 640 | 设置一个 `MaxWidth` 阈值，低于它时图表才可能改变方向。 |
| `NoLinks`, `NoImages` | false | 丢弃图表要求的链接和图片。 |
| `LinkSchemes`, `ImageSchemes` | 见 [SVG](/svg#untrusted-diagrams) | 设置链接和图片在相对 URL 之外可以使用的 URL scheme。 |
| `Padding` | 8 | 设置图表四周的留白。它是指针，所以可以用 `new(0.0)` 设为 0。 |
| `Snap` | 无 | 把位置取整到这个值的倍数，供按整像素绘制的后端使用。 |
| `Routing` | `layout.Auto` | 设置分层布局中边的走向。`Auto` 遵从文本，`layout.Orthogonal` 和 `layout.Straight` 会覆盖它。 |
| `Monospace` | 无 | 设置哪些部分使用等宽字体。`layout.Members` 对应类图的成员，`layout.Attributes` 对应实体关系图中属性的类型、名称和键，`layout.Files` 对应树视图的条目，`layout.Messages` 对应时序图的消息。作者为某个部分指定了字体时，保留作者的字体。 |
| `Now` | `time.Now()` | 设置甘特图的当前时间，用来标出今天，也作为没有开始日期的任务的开始时间。 |
| `Location` | `time.Local` | 设置甘特图读写日期所用的时区。 |

</div>

走向设置适用于流程图，以及泳道图、Agent 流程图、状态图、类图、实体关系图、需求图和用例图。其他图表按 Pele 的方式确定边的走向。

要让同一张图表每次构建都渲染得一样，就设置当前时间和时区。本站的甘特图就是这样做的。

## 场景 {#the-scene}

场景 `rust:limu::scene::Scene` `go:scene.Scene` 是布局好的图表。它有一个尺寸，以及按绘制顺序排列的一组图元（item）。每个图元记录它是什么、在哪里，但不记录它长什么样。它的颜色是主题令牌，到绘制时才解析成具体颜色。

<div data-lang-only="rust">

| 字段 | 内容 |
| --- | --- |
| `kind` | `Kind::Node`、`Group`、`Edge`、表示独立标签的 `Text`，或表示没有标签的形状的 `Mark`。边的 kind 包含它的 `route`，即线条的拐点，以及 `ends`，即两端的标记。 |
| `role` | 图元是哪种图表的哪个部分，比如 `flowchart.node`。样式按角色分配。 |
| `shape` | 图元轮廓的名称，比如 `rect` 或 `diam`。 |
| `id` | 图表给这个图元的 id。 |
| `class`, `tags` | 作者指定的类，以及图表记录的额外信息，比如某个甘特图任务是 `done`。 |
| `bounds` | 图元的位置。`label_bounds()` 返回标签的绘制位置。 |
| `parts` | 图元的轮廓，由路径和方框组成，每一部分都注明如何着色。 |
| `label` | 测量好的标签，以及它的绘制位置和方式。 |
| `picture` | 图元显示的图片或图标。 |
| `style`, `author` | 图表自身为该图元给出的样式，用主题颜色表示，以及作者用 `classDef` 和 `style` 设置的样式。 |
| `link`, `tooltip` | 图元链接到的地址，以及它的提示文字。 |

</div>

<div data-lang-only="go">

| 字段 | 内容 |
| --- | --- |
| `Kind` | `scene.Node`、`Group`、`Edge`、表示独立标签的 `Text`，或表示没有标签的形状的 `Mark`。 |
| `Role` | 图元是哪种图表的哪个部分，比如 `flowchart.node`。样式按角色分配。 |
| `Shape` | 图元轮廓的名称，比如 `rect` 或 `diam`。 |
| `ID` | 图表给这个图元的 id。 |
| `Class`, `Tags` | 作者指定的类，以及图表记录的额外信息，比如某个甘特图任务是 `done`。 |
| `Box` | 图元的位置。`LabelBox()` 返回标签的绘制位置。 |
| `Parts` | 图元的轮廓，由路径和方框组成，每一部分都注明如何着色。 |
| `Route`, `Ends` | 对边而言，是线条的拐点和两端的标记。 |
| `Label`, `At`, `Align`, `Rotate` | 测量好的标签，以及它的绘制位置和方式。 |
| `Picture` | 图元显示的图片或图标。 |
| `Style`, `Author` | 图表自身为该图元给出的样式，用主题颜色表示，以及作者用 `classDef` 和 `style` 设置的样式。 |
| `Link`, `Tooltip` | 图元链接到的地址，以及它的提示文字。 |

</div>

场景是普通的数据，程序可以直接读取。下面的循环打印每个节点的位置。

```rust
use limu::scene::Kind;

for it in &scene.items {
    if matches!(it.kind, Kind::Node) {
        println!("{} {:?} at {:?}", it.role.as_str(), it.id, it.bounds);
    }
}
```

```go
for _, it := range sc.Items {
	if it.Kind == scene.Node {
		fmt.Printf("%s %q at %v\n", it.Role, it.ID, it.Box)
	}
}
```

后端绘制每个图元的轮廓部分、边两端的标记（`rust:Marker::outline` `go:Marker.Outline`）和标签。有自己外观的后端也可以根据图元的角色、形状、位置和走线自行绘制。路径只有四种步骤，分别是移动、直线、二次曲线和三次曲线。圆弧会转换成三次曲线。对于不能绘制曲线或虚线的后端，`rust:Path::flatten` `go:Path.Flatten` 把路径转成折线，`rust:limu::scene::dash` `go:scene.Dash` 把折线切成虚线段。

<div data-lang-only="rust">

Rust 各后端共用的绘制逻辑也在 `limu::scene` 中。后端实现 `Canvas`，负责填充和描边路径、排布文本和图片，`draw` 遍历场景，并为每个图元确定最终样式。`Scene::item_at` 找出某一点上的图元，供需要响应指针的程序使用。

</div>

## 测量文本 {#measuring-text}

布局会测量每个标签，所以图表必须用测量时的字体来绘制，否则文本会放不进布局为它留的空间。测量器 `rust:limu::scene::text::Measurer` `go:text.Measurer` 返回文本在给定字体样式和字号下的宽度。

```rust
pub trait Measurer {
    fn width(&self, s: &str, size: f64, f: Face) -> f64;
}
```

```go
type Measurer interface {
	Width(s string, size float64, f text.Face) float64
}
```

默认测量器 `rust:limu::layout::Arial` `go:text.Arial` 根据一张 Arial 字符宽度表估算宽度，不加载任何字体。它与 Pele 的宽度完全一致，用它测量的 SVG 应该使用 Arial 或宽度相同的字体。如果用其他字体绘制文本，就传入对应这些字体的测量器。在 Rust 中，每个原生后端都为它绘制所用的字体提供了测量器。在 Go 中，`limumygo.Fonts` 是 MyGo 的测量器。

标签中的一段文字还可以是下标、上标或带下划线。布局只向测量器询问粗体、斜体和等宽字体。下标和上标按字号除以 1.2 测量，与 Pele 相同，所以后端绘制时也应按这个比例缩小，并相应下移或上移。下划线不占空间。

### 中文、日文和韩文 {#chinese-japanese-and-korean}

默认测量器把每个中文、日文和韩文字符都当作 1 em 宽，这只是估算，真实字体可能更窄或更宽。标签太宽时会在单词之间换行。和 Pele 1.6 一样，它也会在任意两个中文或日文字符之间换行，但不会让句号、右括号这类标点出现在行首，也不会让左括号这类标点留在行尾。韩文只在单词之间换行。如果要绘制这类文本，就用绘制时的字体来测量。
