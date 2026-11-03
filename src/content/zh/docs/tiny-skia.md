---
title: "tiny-skia"
description: "用 tiny-skia 把图表绘制成位图和 PNG，使用程序自带的字体。"
---

limu-tiny-skia crate 把 limu 的场景绘制到 [tiny-skia](https://github.com/linebender/tiny-skia) 的 pixmap 中，并可以保存为 PNG。它不需要 GPU，也不依赖系统库，所以能在服务器上、命令行工具里，以及 Rust 能编译的任何地方运行。文本由 [rustybuzz](https://github.com/harfbuzz/rustybuzz) 用程序提供的字体文件来塑形，所以同一张图表在每台机器上都画得一样。

limu-rs 还很年轻，API 会在 0.x 的版本中改动。

## 安装 {#installing}

limu-tiny-skia 是一个独立的 crate，这样 limu 和 limu-scene 就只依赖 Rust 标准库。两个 crate 都要添加。

```shell
cargo add limu limu-tiny-skia
```

limu-tiny-skia 把它所用的 tiny-skia 重新导出为 `limu_tiny_skia::tiny_skia`，所以你不必自己对齐版本。下面的例子使用 `limu::scene`，它就是 limu 重新导出的 limu-scene crate。

## 绘制 PNG {#drawing-a-png}

`limu_tiny_skia::render` 把场景绘制到一个新的 pixmap 中。布局时要用绘制时的同一套字体，原因见[字体](#fonts)。

```rust
use limu::scene::style::{Look, Theme};
use limu_tiny_skia::{Fonts, Options};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let fonts = Fonts::new(std::fs::read("Inter-Regular.ttf")?)?;
    let layout = limu::layout::Options {
        measurer: &fonts,
        ..Default::default()
    };
    let scene = limu::layout(
        "flowchart LR
  text[Mermaid text] --> layout[Layout] --> scene[Scene]",
        &layout,
    )?;
    let o = Options {
        look: Look::new(Theme::KOHU),
        fonts: Some(&fonts),
        scale: 2.0,
        ..Options::default()
    };
    let pixmap = limu_tiny_skia::render(&scene, &o).ok_or("the diagram is too large to draw")?;
    pixmap.save_png("diagram.png")?;
    Ok(())
}
```

pixmap 的大小是场景尺寸乘以 `Options.scale`，向上取整到整像素，并用主题的背景色填充。scale 小于等于零时按 1 处理。场景太小或太大、无法放进 pixmap 时，`render` 返回 `None`。

`Options.look` 设置主题和覆盖。参见[主题](/theming)。外观变化时，重新绘制场景即可，不需要重新布局。

## 绘制到自己的 pixmap 中 {#drawing-into-a-pixmap-of-your-own}

`limu_tiny_skia::draw` 把场景绘制到你已有的 pixmap 中。`Transform` 把场景的单位映射到 pixmap 的像素，所以它决定图表画在哪里、画多大。`draw` 不填充背景，也不理会 `Options.scale`。

```rust
use limu_tiny_skia::tiny_skia::{Color, Pixmap, Transform};

let mut pixmap = Pixmap::new(1200, 800).ok_or("no pixmap")?;
pixmap.fill(Color::WHITE);
// 场景的每个单位是 2 个像素，左上角位于 (40, 40)。
let at = Transform::from_row(2.0, 0.0, 0.0, 2.0, 40.0, 40.0);
limu_tiny_skia::draw(&scene, &o, &mut pixmap.as_mut(), at);
```

limu-tiny-skia 画出的图与 SVG 写出的相同，只有一处差别。圆角半径对方框来说太大时，它取宽度一半和高度一半中较小的那个，而 SVG 用的是椭圆形圆角。

与 SVG 一样，图元的不透明度画成一个图层，即叠在下方内容之上的独立 pixmap，所以图元的各部分重叠时，下面的部分不会透出来。

## 字体 {#fonts}

图表用测量器布局，用字体绘制。两者不一致时，文本会放不进布局为它留的空间。`limu_tiny_skia::Fonts` 同时承担这两项工作。它实现了 limu 的 `Measurer`，测量时用 rustybuzz 塑形，方式与绘制时完全相同。

`Fonts::new` 接收一个 TrueType 或 OpenType 文件的数据，作为常规字体，`set` 为某种字体样式添加字体。字体样式有粗体、斜体和等宽，以及它们的任意组合。

```rust
use limu::scene::text::Face;

let mut fonts = Fonts::new(std::fs::read("Inter-Regular.ttf")?)?;
fonts
    .set(Face::BOLD, std::fs::read("Inter-Bold.ttf")?)?
    .set(Face::ITALIC, std::fs::read("Inter-Italic.ttf")?)?
    .set(Face::BOLD | Face::ITALIC, std::fs::read("Inter-BoldItalic.ttf")?)?
    .set(Face::MONO, std::fs::read("JetBrainsMono-Regular.ttf")?)?;
```

对于不是字体的数据，两者都返回 `FontError`。某种字体样式没有提供字体时，文本会用最接近的已提供字体排布。limu-tiny-skia 依次尝试去掉斜体、去掉粗体，最后使用常规字体。没有 `Options.fonts` 时，文本会被省略。

每种字体样式只用它自己的那一个字体，不会回退到其他字体。字体中没有的字符，会画成该字体的缺字符号。要绘制中文、日文或韩文，就提供覆盖这些文字的字体。如果不给布局提供测量器，它会按 Arial 测量文本，所以用其他字体绘制时，只有字宽与 Arial 相同的字体才放得下，比如 Liberation Sans。

字形按轮廓绘制，所以光晕和普通路径一样描边。下划线的位置和粗细取自字体本身。下标下移标签字号的五分之一，上标上移三分之一，与浏览器的位置大致相同。

## 图标和图片 {#icons-and-images}

limu-tiny-skia 从不自行加载图片或打开链接。你的程序知道图片从哪里来，由它来做这些决定。

`Options.icons` 按名称给出图标的各个部件，比如 `fa:fa-car`。limu-rs 的每个后端都以 `limu::scene::Icons` 这同一种形式接收图标，所以一套图标写一次，所有后端都能用。部件位于 24 × 24 的方框中。填充的部件用图元的文本颜色填充，描边的部件用这个颜色描边，线宽 2，端点和拐角都是圆的。布局只为你通过 `layout::Options::icons` 报告的图标留出空间，所以两处要给同一组图标。

`Options.images` 按图片的 URL 返回一个 pixmap。设置了图片的 `fit` 时，图片保持比例并在方框中居中，否则拉伸以填满方框。布局只会传递 scheme 被 `layout::Options::image_schemes` 允许的 URL，图片的加载和缓存由你负责。没有 `icons` 或 `images` 时，图标和图片会被省略。

```rust
use limu::scene::{Painting, Part, Path};

// 位于 24 × 24 方框中的图标，线宽 2，和 Lucide 的图标一样。
fn icon(name: &str) -> Option<Vec<Part>> {
    let d = match name {
        "lucide:plus" => "M5 12h14M12 5v14",
        "lucide:minus" => "M5 12h14",
        _ => return None,
    };
    Some(vec![Part::path(Path::parse(d).ok()?, Painting::StrokeOnly)])
}

let layout = limu::layout::Options {
    measurer: &fonts,
    icons: Some(&|name| icon(name).is_some()),
    ..Default::default()
};
let scene = limu::layout(src, &layout)?;
let o = Options {
    fonts: Some(&fonts),
    icons: Some(Box::new(icon)),
    // pixmaps 是已加载图片的 HashMap<String, Pixmap>。
    images: Some(Box::new(|src| pixmaps.get(src).cloned())),
    ..Options::default()
};
```

`Path::parse` 读取 SVG 路径数据，所以画在 24 × 24 方框上的图标集可以直接使用。

## 自定义绘制 {#custom-drawing}

`limu_tiny_skia::draw_with` 用一个钩子代替默认方式绘制每个图元。钩子会收到一个 `Painter`、图元，以及类型为 `Resolved` 的样式，其中每种颜色都已经确定。painter 的 `item` 按默认方式绘制图元，`parts`、`ends`、`picture` 和 `label` 绘制默认的各个部分。它的 `canvas` 是 `PixmapCanvas`，钩子可以通过它的 `pixmap` 和 `transform` 直接用 tiny-skia 绘制。

```rust
use limu::scene::Kind;
use limu_tiny_skia::tiny_skia::{Paint, Rect, Transform};

limu_tiny_skia::draw_with(&scene, &o, &mut pixmap.as_mut(), Transform::identity(), |p, it, s| {
    if !matches!(it.kind, Kind::Node) {
        p.item(it, s);
        return;
    }
    // 把节点画成我们自己的直角方框，标签按默认方式绘制。
    let b = it.bounds;
    if let Some(r) = Rect::from_xywh(b.x as f32, b.y as f32, b.w as f32, b.h as f32) {
        let mut paint = Paint::default();
        let c = s.fill.color;
        paint.set_color_rgba8(c.r, c.g, c.b, c.a);
        let at = p.canvas().transform();
        p.canvas().pixmap().fill_rect(r, &paint, at, None);
    }
    p.label(it, s);
});
```

钩子在图元不透明度的图层内绘制，所以它收到的样式总是不透明的。`pixmap` 给出钩子绘制的目标，图元有图层时就是那个图层，`transform` 把场景的单位映射到其中。
