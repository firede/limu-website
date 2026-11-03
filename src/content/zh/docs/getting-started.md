---
title: "快速上手"
description: "安装 limu，布局一张图表，并渲染成 SVG。"
---

limu 有两份实现，Rust 版 limu-rs，其 crate 名为 `limu`，以及 Go 版 limu。两者布局图表的方式相同，所以在两者一致的地方，这些页面都称它为 limu。limu 把 Mermaid 文本变成场景，场景记录图表每个部分是什么、在哪里。之后由后端绘制场景。本页使用 SVG 后端，它和 limu 本身一样，只需要标准库。示例有 Rust 和 Go 两种写法。用页面顶部或任意示例上方的切换选择语言，整个网站都会跟着切换。

## 安装 {#installing}

```shell for="rust"
cargo add limu
```

```shell for="go"
go get github.com/firede/limu
```

<div data-lang-only="rust">

limu-rs 需要 Rust 1.95 或更高版本。它还很年轻，API 会在 0.x 的版本中改动。

</div>

<div data-lang-only="go">

limu 需要 Go 1.27 或更高版本。

</div>

## 绘制图表 {#drawing-a-diagram}

`rust:limu::layout` `go:limu.Layout` 读取图表并完成布局，`rust:svg::render` `go:svg.Render` 把得到的场景写成 SVG 文档。

```rust
use limu::scene::style::{Look, Theme};
use limu::scene::svg;

fn main() -> Result<(), limu::Error> {
    let scene = limu::layout(
        "flowchart LR
  text[Mermaid text] --> layout[Layout] --> scene[Scene]",
        &Default::default(),
    )?;
    println!(
        "{}",
        svg::render(
            &scene,
            &svg::Options {
                look: Look::new(Theme::KOHU),
                font_family: Some("Arial, Helvetica, sans-serif".into()),
                ..Default::default()
            },
        )
    );
    Ok(())
}
```

```go
package main

import (
	"fmt"
	"log"

	"github.com/firede/limu"
	"github.com/firede/limu/style"
	"github.com/firede/limu/svg"
)

func main() {
	sc, err := limu.Layout(`flowchart LR
  text[Mermaid text] --> layout[Layout] --> scene[Scene]`, nil)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(svg.Render(sc, &svg.Options{
		Look:       style.Look{Theme: style.Kohu()},
		FontFamily: "Arial, Helvetica, sans-serif",
	}))
}
```

布局默认用一张 Arial 字符宽度表测量文本，即 `rust:limu::layout::Arial` `go:text.Arial`，所以 SVG 应该用 Arial 或宽度相同的字体显示文字。如果用其他字体绘制文本，就要改用这些字体来测量。参见[测量文本](/api#measuring-text)。

主题决定图表的颜色。SVG 后端把颜色写成 CSS 变量，并以主题的颜色作为回退值，所以页面无需重新渲染图表就能改变颜色。参见[主题](/theming)。

## 错误 {#errors}

limu 无法读取一张图表时会返回错误，类型是 `rust:limu::Error` `go:*diagram.Error`。错误码说明问题是类型不受支持、文本无法解析，还是文本超出了限制。有位置时，行号和列号会指出它。

```rust
match limu::layout(src, &Default::default()) {
    Ok(scene) => draw(&scene),
    Err(e) => println!("{} at line {}: {}", e.code.as_str(), e.line, e.message),
}
```

```go
sc, err := limu.Layout(src, nil)
var derr *diagram.Error
if errors.As(err, &derr) {
	fmt.Printf("%s at line %d: %s\n", derr.Code, derr.Line, derr.Message)
}
```

错误信息可能引用图表的文本，所以要把它当作纯文本显示，不要当作 HTML 或 SVG 解析。

## 适应宽度 {#fitting-a-width}

把布局的最大宽度 `rust:layout::Options::max_width` `go:layout.Options.MaxWidth` 设为可用的宽度。能变窄的图表会变窄，所以一张宽的流程图可能从横向排列改为纵向排列。不能变窄的图表保持所需的宽度。

```rust
let scene = limu::layout(
    src,
    &limu::layout::Options {
        max_width: 480.0,
        ..Default::default()
    },
)?;
```

```go
sc, err := limu.Layout(src, &layout.Options{MaxWidth: 480})
```

SVG 的尺寸就是场景的尺寸。要让页面把它进一步缩小，在 CSS 中给它设置 `max-width: 100%` 和 `height: auto`。

## 重新布局 {#laying-out-again}

如果同一张图表要布局不止一次，比如可用宽度变了，就用 `rust:limu::parse` `go:limu.Parse` 解析一次，再按需多次布局解析结果。布局不会修改解析出的图表，所以可以在多个 goroutine 或线程中同时进行。

```rust
use limu::layout::Options;

let d = limu::parse(src, &limu::ParseOptions::default())?;
let wide = d.layout(&Options { max_width: 640.0, ..Default::default() })?;
let narrow = d.layout(&Options { max_width: 320.0, ..Default::default() })?;
```

```go
d, err := limu.Parse(src, diagram.Options{})
if err != nil {
	return err
}
wide, err := d.Layout(&layout.Options{MaxWidth: 640})
narrow, err := d.Layout(&layout.Options{MaxWidth: 320})
```

换主题完全不需要重新布局，用新主题绘制同一个场景即可。

## 图表类型 {#diagram-types}

Pele 能画的图表类型 limu 都支持，涵盖 Mermaid 内置的所有类型。`rust:limu::types` `go:limu.Types` 列出这些类型。`rust:limu::supports` `go:limu.Supports` 只检查文本声明的类型，不解析其余部分。

```rust
if !limu::supports(src) {
    // 改为把文本当作代码显示。
}
```

```go
if !limu.Supports(src) {
	// 改为把文本当作代码显示。
}
```

<div data-lang-only="rust">

`limu` crate 为每种图表类型提供一个 feature，默认全部开启。只读取部分类型的程序可以设置 `default-features = false`，再开启所需类型的 feature，比如 `flowchart` 和 `sequence`。feature 关闭的类型会被当作不受支持的图表。

</div>

[示例](/examples)展示了每种类型，[兼容性](/compatibility)列出了声明它们的关键字。

## 下一步 {#next-steps}

- [API](/api) 介绍解析与布局选项、限制和场景。
- [主题](/theming) 介绍主题、按角色覆盖样式和自定义绘制。
- [SVG](/svg) 介绍 CSS 变量、类名和不可信的图表。
- 各个后端以原生方式绘制图表。在 Rust 中，[tiny-skia](/tiny-skia) 绘制到位图，[Core Graphics](/core-graphics) 在 Apple 平台上绘制，[GPUI](/gpui) 在 GPUI 窗口中绘制，[终端](/terminal)在终端的字符格中绘制。在 Go 中，[MyGo](/mygo) 在 GPU 上绘制，并能找出指针下方的部分。
