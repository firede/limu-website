---
title: "SVG"
description: "把图表渲染成 SVG，用 CSS 变量设置样式，处理不可信的输入。"
---

SVG 后端 `rust:limu::scene::svg` `go:svg` 把场景渲染成 SVG 文档，效果与 Pele 绘制的一致。和 limu 的其他部分一样，它只用到标准库。

```rust
use limu::scene::style::{Look, Theme};
use limu::scene::svg;

let scene = limu::layout(src, &Default::default())?;
let out = svg::render(
    &scene,
    &svg::Options {
        look: Look::new(Theme::KOHU),
        font_family: Some("Arial, Helvetica, sans-serif".into()),
        ..Default::default()
    },
);
```

```go
sc, err := limu.Layout(src, nil)
if err != nil {
	return err
}
out := svg.Render(sc, &svg.Options{
	Look:       style.Look{Theme: style.Kohu()},
	FontFamily: "Arial, Helvetica, sans-serif",
})
```

## 选项 {#options}

| 字段 | 作用 |
| --- | --- |
| `rust:look` `go:Look` | 设置主题和覆盖。参见[主题](/theming)。 |
| `rust:literal` `go:Literal` | 把主题颜色写成普通颜色，而不是 CSS 变量。 |
| `rust:font_family, mono_family` `go:FontFamily, MonoFamily` | 指定测量场景时所用的字体。默认是 `sans-serif` 和 `monospace`。 |
| `rust:link_schemes, image_schemes` `go:LinkSchemes, ImageSchemes` | 设置链接和图片在相对 URL 之外可以使用的 URL scheme。参见[不可信的图表](#untrusted-diagrams)。 |
| `rust:icon_markup` `go:IconMarkup` | 按名称返回图标的 SVG 代码。参见[图标](#icons)。 |
| `rust:render_with` `go:Draw` | 代替默认方式写出每个图元。在 Rust 中，它是一个单独的函数，而不是选项。参见[自定义绘制](#custom-drawing)。 |

### 字体 {#fonts}

除非你提供别的测量器，布局都用 Arial 的宽度测量文本。SVG 必须使用测量文本时的字体，否则标签会放不进它的形状。使用默认测量器时，就用 Arial 或宽度相同的字体。

```rust
svg::render(&scene, &svg::Options {
    font_family: Some("Arial, Helvetica, sans-serif".into()),
    ..Default::default()
})
```

```go
svg.Render(sc, &svg.Options{FontFamily: "Arial, Helvetica, sans-serif"})
```

如果页面设置了 `--limu-font` 或 `--limu-font-mono`，它们优先生效。用自己的字体测量文本的页面，可以用这两个变量让 SVG 也使用该字体。

## 主题变量 {#theme-variables}

SVG 把每种主题颜色写成 CSS 变量，并以主题的颜色作为回退值，比如 `var(--limu-surface,#e5eeec)`。SVG 内联在页面中时，页面设置的变量优先。这样页面无需重新渲染图表就能改变颜色，比如在浅色和深色主题之间切换。

```css
.diagram {
  --limu-bg: #f1f6f5;
  --limu-fg: #0f262a;
  --limu-line: #23393d;
  --limu-surface: #e5eeec;
  --limu-border: #76939a;
  --limu-accent: #a92e4a;
}

@media (prefers-color-scheme: dark) {
  .diagram {
    --limu-bg: #0c1618;
    --limu-fg: #d0dddc;
    --limu-line: #b4c7c7;
    --limu-surface: #142428;
    --limu-border: #557176;
    --limu-accent: #ee8494;
  }
}
```

| 变量 | 令牌 |
| --- | --- |
| `--limu-bg` | `rust:bg` `go:Bg` |
| `--limu-fg` | `rust:fg` `go:Fg` |
| `--limu-muted` | `rust:muted` `go:Muted` |
| `--limu-line` | `rust:line` `go:Line` |
| `--limu-surface` | `rust:surface` `go:Surface` |
| `--limu-surface-alt` | `rust:surface_alt` `go:SurfaceAlt` |
| `--limu-border` | `rust:border` `go:Border` |
| `--limu-accent` | `rust:accent` `go:Accent` |
| `--limu-critical` | `rust:critical` `go:Critical` |
| `--limu-series-1` … `--limu-series-8` | `rust:series(0) … series(7)` `go:Series(0) … Series(7)` |
| `--limu-font`, `--limu-font-mono` | 上文介绍的字体 |

[主题](/theming#themes)列出了 limu 各主题的取值。不来自主题的颜色，比如图表作者设置的颜色，会写成普通颜色，不受变量影响。

通过 `<img>` 显示或保存成文件的 SVG 看不到页面的变量，所以使用回退值。如果读取 SVG 的程序不支持 CSS 变量，就设置 `rust:literal` `go:Literal`。

## 类名 {#classes}

每个图元所在的分组都带有描述它的类名，页面的 CSS 可以据此选中它们。

| 类名 | 元素 |
| --- | --- |
| `limu`, `limu-<type>` | 根 `<svg>`，比如 `limu-flowchart` |
| `limu-node`, `limu-group`, `limu-edge`, `limu-text`, `limu-mark` | 图元的分组，按种类区分 |
| `limu-<role>` | 图元的分组，按角色区分，角色中的点换成短横线，比如 `limu-flowchart-node` |
| `limu-shape-<shape>` | 图元的分组，按形状区分，比如 `limu-shape-diam` |
| 图元的 tag 和类 | 图表记录的额外信息，比如甘特图任务的 `done`，以及作者指定的类 |
| `limu-marker` | 边端点的标记，比如箭头 |
| `limu-icon` | 图标 |

有 id 的图元还会带上 `data-id` 属性。

```css
.limu-flowchart-node[data-id="scene"] rect {
  stroke: var(--limu-accent);
  stroke-width: 2;
}
```

根元素的 `width`、`height` 和 `viewBox` 与场景的尺寸一致。要让它在窄页面上缩小，就给它设置 `max-width: 100%` 和 `height: auto`。

为了辅助技术，图表的 `accTitle` 和 `accDescr` 会成为它的 `<title>` 和 `<desc>`，根元素的角色是 `graphics-document`。

## 图标 {#icons}

标签中可以包含 `fa:fa-car` 这样的图标，流程图的节点也可以显示图标。图标代码选项 `rust:icon_markup` `go:IconMarkup` 返回放进图标 `<svg>` 中的 SVG 代码，坐标系是 24 × 24 的网格。这段代码应该用 `currentColor` 绘制，它被设为图元的文本颜色。布局只为你通过布局的图标选项 `rust:layout::Options::icons` `go:layout.Options.Icons` 报告的图标留出空间，所以两处要给同一组图标。

```rust
use std::collections::HashMap;

let icons = HashMap::from([(
    "fa:fa-car",
    r#"<path d="M5 17h14v-5l-2-5H7l-2 5z" fill="currentColor"/>"#,
)]);
let has = |name: &str| icons.contains_key(name);
let scene = limu::layout(
    src,
    &limu::layout::Options { icons: Some(&has), ..Default::default() },
)?;
let out = svg::render(
    &scene,
    &svg::Options {
        icon_markup: Some(Box::new(|name| icons.get(name).map(|m| m.to_string()))),
        ..Default::default()
    },
);
```

```go
icons := map[string]string{
	"fa:fa-car": `<path d="M5 17h14v-5l-2-5H7l-2 5z" fill="currentColor"/>`,
}
sc, err := limu.Layout(src, &layout.Options{
	Icons: func(name string) bool { _, ok := icons[name]; return ok },
})
out := svg.Render(sc, &svg.Options{
	IconMarkup: func(name string) string { return icons[name] },
})
```

没有图标代码时，图标会被省略。架构图和树视图还有内置图标，不需要提供代码。

## 自定义绘制 {#custom-drawing}

<div data-lang-only="rust">

`svg::render_with` 用你的函数代替默认方式写出每个图元。函数会收到一个 `Painter`、图元和它解析后的样式。painter 的 `item` 按默认方式写出图元，`parts`、`ends`、`picture` 和 `label` 写出默认的各个部分。它的画布 `canvas()` 是 `svg::Writer`，用 `raw` 写入你自己的 SVG 代码，用 `escaped` 写入转义后的文本，用 `num` 写入数字，用 `path_data` 写入路径。解析后的样式保留了每种颜色的来源，所以 `paint` 和 `paint_attr` 仍然能把主题颜色写成 CSS 变量。

</div>

<div data-lang-only="go">

`Draw` 代替默认方式写出每个图元，`next` 按默认方式写出它。它收到的 `svg.Writer` 可以用 `Item`、`Parts`、`Ends`、`Picture` 和 `Label` 写出默认的各个部分，用 `Raw` 写入你自己的 SVG 代码，用 `Text` 写入转义后的文本，用 `Num` 写入数字。它收到的样式已经按外观层叠，但还没有解析成颜色，所以 `Paint` 和 `PaintAttr` 仍然能把主题颜色写成 CSS 变量。

</div>

```rust
use limu::scene::Kind;

let o = svg::Options { look, ..Default::default() };
svg::render_with(&scene, &o, |p, it, s| {
    if !matches!(it.kind, Kind::Node) {
        p.item(it, s);
        return;
    }
    // 把节点画成我们自己的方框，标签按默认方式绘制。
    let b = it.bounds;
    let w = p.canvas();
    w.raw(r#"<rect rx="8" x=""#);
    w.num(b.x);
    w.raw(r#"" y=""#);
    w.num(b.y);
    w.raw(r#"" width=""#);
    w.num(b.w);
    w.raw(r#"" height=""#);
    w.num(b.h);
    w.raw(r#"""#);
    w.paint_attr("fill", &s.fill);
    w.raw("/>");
    p.label(it, s);
})
```

```go
svg.Render(sc, &svg.Options{
	Look: look,
	Draw: func(w *svg.Writer, it *scene.Item, s style.Style, next func()) {
		if it.Kind != scene.Node {
			next()
			return
		}
		// 把节点画成我们自己的方框，标签按默认方式绘制。
		b := it.Box
		w.Raw(`<rect rx="8" x="`)
		w.Num(b.X)
		w.Raw(`" y="`)
		w.Num(b.Y)
		w.Raw(`" width="`)
		w.Num(b.W)
		w.Raw(`" height="`)
		w.Num(b.H)
		w.Raw(`"`)
		w.PaintAttr("fill", s.Fill)
		w.Raw(`/>`)
		w.Label(it, s)
	},
})
```

## 不可信的图表 {#untrusted-diagrams}

图表文本有时来自你不信任的人，比如用户在你的应用里分享的笔记。limu 会转义它写出的所有文本，从不写出脚本、事件处理器或 HTML。调用函数的 `click` 会被丢弃。其余的事由你的应用负责。

### 链接和图片 {#links-and-images}

图表可以把某个部分链接到 URL，也可以显示来自 URL 的图片。只有当 URL 是相对路径，或者使用你允许的 scheme 时，布局才会保留链接或图片。

| 用途 | 默认允许的 scheme |
| --- | --- |
| 链接 | `http`、`https`、`mailto`、`tel` |
| 图片 | `http`、`https` |

`javascript:`、`data:` 和 `vbscript:` 始终被拦截，`//host/share` 这样的网络路径也是。显示 SVG 时，图片会发起网络请求。要丢弃所有链接或所有图片，在布局选项中设置 `rust:links: false` `rust:images: false` `go:NoLinks` `go:NoImages`。

scheme 会检查两次。第一次由布局按它的链接和图片 scheme 检查，第二次由 SVG 后端按它自己的选项做最后检查。要允许另一个 scheme，两处都要加上。

```rust
let schemes = ["http", "https", "mailto", "obsidian"];
let scene = limu::layout(
    src,
    &limu::layout::Options { link_schemes: &schemes, ..Default::default() },
)?;
let out = svg::render(
    &scene,
    &svg::Options {
        link_schemes: Some(schemes.map(String::from).to_vec()),
        ..Default::default()
    },
);
```

```go
schemes := []string{"http", "https", "mailto", "obsidian"}
sc, err := limu.Layout(src, &layout.Options{LinkSchemes: schemes})
out := svg.Render(sc, &svg.Options{LinkSchemes: schemes})
```

链接写成不带 target 的 `<a href>`。SVG 内联时，链接如何打开由页面决定，和页面自己的链接一样。

### 限制 {#limits}

默认情况下，图表文本最长 50,000 个 UTF-16 码元，流程图和 Agent 流程图最多 5,000 条边。参见[限制](/api#limits)。布局一旦开始，limu 就无法中止，所以对不可信的文本要保留这些限制。

### 应用要负责的事 {#what-your-app-is-responsible-for}

SVG 后端会原样插入图标的 SVG 代码。只从你信任的图标集中返回代码，未知的名称不返回任何内容，也不要把名称本身放进代码。

错误信息可能引用图表的文本，所以要把它当作纯文本显示，不要当作 HTML 或 SVG 解析。

limu 逐个属性读取作者的样式，并写成属性，同时丢弃可能引用图表之外内容的值，比如 `url()`。不要让图表作者设置你的选项，比如解析图表时用的配置或允许的 scheme。
