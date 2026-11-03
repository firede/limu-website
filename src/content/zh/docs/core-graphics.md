---
title: "Core Graphics"
description: "在 Apple 平台上用 Core Graphics 绘制图表，并用 Core Text 测量其中的文本。"
---

limu-coregraphics crate 用 Core Graphics 绘制 limu 的场景，可以绘制到应用提供的 `CGContext` 中，也可以绘制到它创建的 `CGImage` 中。文本由 Core Text 塑形，与 Apple 平台上应用中的其他文本一样，所以图表可以使用系统字体，或应用自带的字体。它适合在 macOS 和 iOS 上自己绘制视图的应用，无论用的是 AppKit、UIKit，还是其他能提供 `CGContext` 的工具包。

limu-rs 还很年轻，API 会在 0.x 的版本中改动。

## 安装 {#installing}

limu-coregraphics 是一个独立的 crate，这样 limu 和 limu-scene 就只依赖 Rust 标准库。两个 crate 都要添加。

```shell
cargo add limu limu-coregraphics
```

这个 crate 通过 objc2 的绑定调用 Core Graphics 和 Core Text，并把它们重新导出为 `limu_coregraphics::objc2_core_foundation`、`objc2_core_graphics` 和 `objc2_core_text`。在 Apple 以外的平台上它是空的，所以同时面向其他平台的项目可以在所有平台上依赖它。下面的例子使用 `limu::scene`，它就是 limu 重新导出的 limu-scene crate。

## 绘制图像 {#drawing-an-image}

`limu_coregraphics::render` 把场景绘制到一张新的图像中。布局时要用绘制时的同一套字体，原因见[字体](#fonts)。

```rust
use limu::scene::style::{Look, Theme};
use limu_coregraphics::{Fonts, Options};

let fonts = Fonts::from_data(&std::fs::read("Inter-Regular.ttf")?)?;
let layout = limu::layout::Options {
    measurer: &fonts,
    ..Default::default()
};
let scene = limu::layout(src, &layout)?;
let o = Options {
    look: Look::new(Theme::KOHU),
    fonts: Some(&fonts),
    scale: 2.0,
    ..Options::default()
};
let image = limu_coregraphics::render(&scene, &o).ok_or("the diagram is too large to draw")?;
```

图像使用 sRGB，大小是场景尺寸乘以 `Options.scale`，向上取整到整像素，并用主题的背景色填充。scale 小于等于零时按 1 处理。场景太小或太大、无法生成图像时，`render` 返回 `None`。可以把图像显示在视图或图层中，也可以用 Image I/O 写入文件。

`Options.look` 设置主题和覆盖。参见[主题](/theming)。外观变化时，比如系统切换到深色模式，重新绘制场景即可，不需要重新布局。

## 在视图中绘制 {#drawing-in-a-view}

`limu_coregraphics::draw` 把场景绘制到你提供的上下文中，使用上下文的用户空间，y 轴向下。翻转过的视图的上下文已经是这样设置的，所以在翻转的 `NSView` 或 `UIView` 中，直接绘制到 `draw(_:)` 的上下文即可。要缩放，先缩放上下文。

```rust
use limu_coregraphics::objc2_core_graphics::CGContext;

/// 在视图的上下文中按缩放比例绘制场景。翻转过的视图的上下文 y 轴向下，与场景一致。
fn draw_zoomed(cx: &CGContext, scene: &Scene, o: &Options<'_>, zoom: f64) {
    CGContext::save_g_state(Some(cx));
    CGContext::scale_ctm(Some(cx), zoom, zoom);
    limu_coregraphics::draw(scene, o, cx);
    CGContext::restore_g_state(Some(cx));
}
```

y 轴向上的上下文，比如位图上下文或未翻转视图的上下文，需要先翻转过来，`render` 对它自己的上下文也是这样做的。

```rust
// 对 y 轴向上、高 height 个单位的上下文，先把它翻转过来。
CGContext::translate_ctm(Some(cx), 0.0, height);
CGContext::scale_ctm(Some(cx), 1.0, -1.0);
```

`draw` 不填充背景，也不理会 `Options.scale`。它会把上下文的状态恢复原样。

limu-coregraphics 画出的图与 SVG 写出的相同，只有一处差别。圆角半径对方框来说太大时，它取宽度一半和高度一半中较小的那个，而 SVG 用的是椭圆形圆角。

与 SVG 一样，图元的不透明度画成一个透明图层，所以图元的各部分重叠时，下面的部分不会透出来。

## 字体 {#fonts}

图表用测量器布局，用字体绘制。两者不一致时，文本会放不进布局为它留的空间。`limu_coregraphics::Fonts` 同时承担这两项工作。它实现了 limu 的 `Measurer`，按 Core Text 绘制时排布每一行的方式来测量。

`Fonts::from_data` 接收一个 TrueType 或 OpenType 文件的数据，作为常规字体，适合自带字体的应用，`set_data` 为某种字体样式添加字体。对于不是字体的数据，它们返回 `FontError`。`Fonts::new` 和 `set` 则接收 `CTFont`，用于系统字体。字体样式有粗体、斜体和等宽，以及它们的任意组合。

```rust
use limu::scene::text::Face;
use limu_coregraphics::Fonts;
use limu_coregraphics::objc2_core_foundation::{CFRetained, CFString};
use limu_coregraphics::objc2_core_text::CTFont;

fn font(name: &str) -> CFRetained<CTFont> {
    // SAFETY: 空矩阵表示单位矩阵。
    unsafe { CTFont::with_name(&CFString::from_str(name), 12.0, std::ptr::null()) }
}

let mut fonts = Fonts::new(font("Helvetica"));
fonts
    .set(Face::BOLD, font("Helvetica-Bold"))
    .set(Face::ITALIC, font("Helvetica-Oblique"))
    .set(Face::MONO, font("Menlo-Regular"));
```

创建字体时的字号无关紧要，因为文本按标签要求的字号排布。某种字体样式没有提供字体时，文本会用最接近的已提供字体排布。limu-coregraphics 依次尝试去掉斜体、去掉粗体，最后使用常规字体。没有 `Options.fonts` 时，文本会被省略。如果不给布局提供测量器，它会按 Arial 测量文本，所以用其他字体绘制时，只有字宽与 Arial 相同的字体才放得下。

对于字体中没有的字符，比如拉丁字体中的中文、日文或韩文，Core Text 会回退到系统字体。`Fonts` 测量的是含有回退字体的整行，所以这些文本也放得下。字形按轮廓绘制，所以光晕和普通路径一样描边。下划线的位置和粗细取自字体本身。下标下移标签字号的五分之一，上标上移三分之一，与浏览器的位置大致相同。

## 图标和图片 {#icons-and-images}

limu-coregraphics 从不自行加载图片或打开链接。你的应用知道图片从哪里来，由它来做这些决定。

`Options.icons` 按名称给出图标的各个部件，比如 `fa:fa-car`。limu-rs 的每个后端都以 `limu::scene::Icons` 这同一种形式接收图标，所以为 [tiny-skia](/tiny-skia#icons-and-images) 写的图标集在这里可以直接使用。部件位于 24 × 24 的方框中。填充的部件用图元的文本颜色填充，描边的部件用这个颜色描边，线宽 2，端点和拐角都是圆的。布局只为你通过 `layout::Options::icons` 报告的图标留出空间，所以两处要给同一组图标。

`Options.images` 按图片的 URL 返回一个 `CGImage`。设置了图片的 `fit` 时，图片保持比例并在方框中居中，否则拉伸以填满方框。布局只会传递 scheme 被 `layout::Options::image_schemes` 允许的 URL，图片的加载和缓存由你负责。没有 `icons` 或 `images` 时，图标和图片会被省略。

```rust
let o = Options {
    fonts: Some(&fonts),
    icons: Some(Box::new(icon)),
    // images 是已加载图片的 HashMap<String, CFRetained<CGImage>>。
    images: Some(Box::new(|src| images.get(src).cloned())),
    ..Options::default()
};
```

带链接的图元被点击时，它的 `link` 字段保存着目标地址。按应用打开其他链接的方式打开它，或者不打开。`Scene::item_at` 按场景的单位找出某一点上的图元，用法见 [GPUI](/gpui#finding-the-item-under-the-pointer) 页面。

## 自定义绘制 {#custom-drawing}

`limu_coregraphics::draw_with` 用一个钩子代替默认方式绘制每个图元。钩子会收到一个 `Painter`、图元，以及类型为 `Resolved` 的样式，其中每种颜色都已经确定。painter 的 `item` 按默认方式绘制图元，`parts`、`ends`、`picture` 和 `label` 绘制默认的各个部分。它的 `canvas` 是 `ContextCanvas`，钩子可以通过它的 `context` 直接用 Core Graphics 绘制，坐标单位与场景相同。

```rust
use limu::scene::Kind;
use limu_coregraphics::objc2_core_foundation::{CGPoint, CGRect, CGSize};
use limu_coregraphics::objc2_core_graphics::CGContext;

limu_coregraphics::draw_with(&scene, &o, cx, |p, it, s| {
    if !matches!(it.kind, Kind::Node) {
        p.item(it, s);
        return;
    }
    // 把节点画成我们自己的直角方框，标签按默认方式绘制。
    let cx = Some(p.canvas().context());
    let (b, c) = (it.bounds, s.fill.color);
    let k = |v: u8| f64::from(v) / 255.0;
    CGContext::set_rgb_fill_color(cx, k(c.r), k(c.g), k(c.b), k(c.a));
    CGContext::fill_rect(cx, CGRect::new(CGPoint::new(b.x, b.y), CGSize::new(b.w, b.h)));
    p.label(it, s);
});
```

钩子在图元不透明度的透明图层内绘制，所以它收到的样式总是不透明的。
