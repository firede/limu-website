---
title: "GPUI"
description: "在 GPUI 窗口中绘制图表，用 GPUI 的文本系统测量文本，并找出指针下方的部分。"
---

limu-gpui crate 在 [GPUI](https://www.gpui.rs) 窗口中绘制 limu 的场景。GPUI 是 Zed 所用的 UI 框架。场景在元素的绘制阶段绘制，与窗口的其余部分一起在 GPU 上完成。文本由 GPUI 自己的文本系统测量和排布，所以图表使用应用的字体。limu-scene 能找出指针下方的图元，所以窗口中的图表可以响应点击。

limu-rs 还很年轻，API 会在 0.x 的版本中改动。

## 安装 {#installing}

limu-gpui 基于 [gpui-pre](https://crates.io/crates/gpui-pre) 0.3.11，它是 crates.io 上发布的 Zed GPUI 每周快照，你的应用也要用同一个版本。在 `Cargo.toml` 中把它命名为 `gpui`，这样它的宏生成的路径才能解析。在 macOS 上，要开启 gpui-pre-platform 的 `font-kit` feature，否则画不出任何文本。要使用你自己的 GPUI，比如打了补丁的版本，用 `[patch.crates-io]` 在整个构建中替换 gpui-pre。

```toml
[dependencies]
gpui = { package = "gpui-pre", version = "0.3.11" }
gpui_platform = { package = "gpui-pre-platform", version = "0.3.11", features = ["font-kit"] }
limu = "0.2"
limu-gpui = "0.2"
```

下面的例子使用 `limu::scene`，它就是 limu 重新导出的 limu-scene crate。

## 显示图表 {#showing-a-diagram}

`limu_gpui::paint` 把场景绘制在窗口中，左上角位于给定的点，场景的每个单位对应若干像素。在 `canvas` 元素的绘制闭包中调用它，或者在你自己元素的绘制阶段调用。布局时要用窗口的文本系统，原因见[字体](#fonts)。

```rust
use std::sync::Arc;

use gpui::{
    App, Bounds, Context, Pixels, Window, WindowBounds, WindowOptions, canvas, div, prelude::*,
    px, rgba, size,
};
use limu::scene::Scene;
use limu::scene::style::{Color, Look, Theme};
use limu_gpui::{Fonts, Options, TextMeasurer, paint};

const SOURCE: &str = "flowchart LR
  text[Mermaid text] --> layout[Layout] --> scene[Scene]";

struct Diagram {
    scene: Arc<Scene>,
    look: Look,
}

impl Diagram {
    fn new(window: &Window) -> Diagram {
        // 用窗口的文本系统测量文本，字体与绘制时相同。
        let measurer = TextMeasurer::new(window, Fonts::default());
        let layout = limu::layout::Options {
            measurer: &measurer,
            ..Default::default()
        };
        let scene = limu::layout(SOURCE, &layout).expect("a diagram");
        Diagram {
            scene: Arc::new(scene),
            look: Look::new(Theme::KOHU),
        }
    }
}

impl Render for Diagram {
    fn render(&mut self, _: &mut Window, _: &mut Context<Self>) -> impl IntoElement {
        let scene = self.scene.clone();
        let look = self.look.clone();
        div().size_full().p(px(16.0)).bg(color(look.theme.bg)).child(
            canvas(
                |_, _, _| {},
                move |bounds: Bounds<Pixels>, _, window, cx| {
                    let o = Options {
                        look,
                        ..Options::default()
                    };
                    paint(&scene, &o, bounds.origin, 1.0, window, cx);
                },
            )
            .size_full(),
        )
    }
}

/// 把 limu 的颜色转换成 GPUI 的颜色。
fn color(c: Color) -> gpui::Rgba {
    rgba(u32::from_be_bytes([c.r, c.g, c.b, c.a]))
}

fn main() {
    gpui_platform::application().run(|cx: &mut App| {
        let bounds = Bounds::centered(None, size(px(640.0), px(360.0)), cx);
        cx.open_window(
            WindowOptions {
                window_bounds: Some(WindowBounds::Windowed(bounds)),
                ..Default::default()
            },
            |window, cx| cx.new(|_| Diagram::new(window)),
        )
        .expect("a window");
        cx.activate(true);
    });
}
```

`paint` 不绘制场景的背景，所以例子用主题的背景色填充了元素。`Options.look` 设置主题和覆盖。参见[主题](/theming)。外观变化时，比如窗口切换到深色模式，只需重新绘制场景。

要缩放或平移，改变缩放比例和绘制的起点。要让图表适应元素，就在元素宽度变化时，用新的 `max_width` 重新布局。`TextMeasurer` 可以克隆并保存下来，留作此用。用 `limu::parse` 解析一次文本，再用它返回的 `Diagram` 布局。

### 找出指针下方的图元 {#finding-the-item-under-the-pointer}

`Scene::item_at` 按场景的单位找出某一点上的图元，返回它在 `scene.items` 中的下标。多个图元重叠时，它返回最后绘制的那个，也就是最上面的那个。点落在图元的方框或其标签的方框内，就算命中。对于边和只由线条构成的图元，点与线条的距离在容差以内，或落在它们的某个标记内，就算命中。

在窗口中使用时，要用绘制时的起点和缩放比例，把指针位置换算回场景的单位。下面的监听器放在 canvas 的绘制闭包中、`paint` 之后，其中 `scale` 是传给 `paint` 的缩放比例，`this` 是在 `render` 中取得的 `cx.entity()`。

```rust
window.on_mouse_event(move |e: &MouseDownEvent, phase, _, cx| {
    if phase != DispatchPhase::Bubble || e.button != MouseButton::Left {
        return;
    }
    // 指针在场景单位下的位置。
    let at = Point::new(
        f64::from(e.position.x - bounds.origin.x) / f64::from(scale),
        f64::from(e.position.y - bounds.origin.y) / f64::from(scale),
    );
    let Some(i) = scene.item_at(at, 4.0 / f64::from(scale)) else {
        return;
    };
    let it = &scene.items[i];
    let clicked = format!("{} {}", it.role, it.id.as_deref().unwrap_or(""));
    this.update(cx, |d, cx| {
        d.clicked = clicked;
        cx.notify();
    });
});
```

这里的容差是 4 个像素，换算成了场景的单位。图元的 `tooltip` 保存指针悬停时要显示的文字，`link` 保存它指向的地址。limu-gpui 不会自行打开链接。按应用打开其他链接的方式打开它，或者不打开。

## 字体 {#fonts}

图表用测量器布局，用字体绘制。两者不一致时，文本会放不进布局为它留的空间。`limu_gpui::Fonts` 指定两个字体族，`sans` 用于普通文本，`mono` 用于等宽文本，粗体和斜体文本使用字体族中的粗体和斜体。它的默认值是 Arial 和 Courier New，也就是 limu 在没有测量器时测量所用的字体。

`TextMeasurer` 按窗口的文本系统用这些字体排布文本的方式来测量。它需要一个窗口，所以要在有了窗口之后再布局图表，比如在创建窗口的视图时。测量器和 `Options.fonts` 要使用同样的字体族。

```rust
let fonts = Fonts {
    sans: "Inter".into(),
    mono: "JetBrains Mono".into(),
};
let measurer = TextMeasurer::new(window, fonts.clone());
// 用这个测量器布局，并用 Options { fonts, .. } 绘制。
```

大多数文本由测量器所用的同一个文本系统塑形，并沿基线逐个字形绘制。GPUI 只能绘制正立、填充的字形，所以有两类文本改为以 SVG 文本绘制。一类是旋转过的标签，比如坐标轴标题或泳道的名称，另一类是标签文字周围的光晕。这些文本由 GPUI 绘制图标所用的 SVG 库 usvg 塑形，使用系统字体和应用作为资源打包的字体，所以只添加到 GPUI 文本系统中的字体族在这里找不到。

## GPUI 绘制上的差异 {#what-gpui-draws-differently}

在 GPUI 允许的范围内，limu-gpui 画出的图与 SVG 写出的相同。

- GPUI 没有可单独绘制的图层，所以 limu-gpui 把图元的不透明度乘到它的每种颜色上。图元的各部分重叠时，下面的部分会透出来。
- 图片画成不透明的，这是 GPUI 绘制图片的方式。
- GPUI 不对外提供字体的度量信息，所以下划线画在基线下方文字字号十分之一处，粗细为字号的十五分之一。
- 圆角半径对方框来说太大时，limu-gpui 取宽度一半和高度一半中较小的那个，而 SVG 用的是椭圆形圆角。

路径由 GPUI 做三角剖分，按非零规则填充，描边使用 SVG 的端点、连接和斜接限制。

## 图标和图片 {#icons-and-images}

limu-gpui 从不自行加载图片。你的应用知道图片从哪里来，由它来做这些决定。

`Options.icons` 按名称给出图标的各个部件，比如 `fa:fa-car`。limu-rs 的每个后端都以 `limu::scene::Icons` 这同一种形式接收图标，所以为 [tiny-skia](/tiny-skia#icons-and-images) 写的图标集在这里可以直接使用。部件位于 24 × 24 的方框中。填充的部件用图元的文本颜色填充，描边的部件用这个颜色描边，线宽 2，端点和拐角都是圆的。布局只为你通过 `layout::Options::icons` 报告的图标留出空间，所以两处要给同一组图标。

`Options.images` 按图片的 URL 返回一个 GPUI 的 `RenderImage`。GPUI 按蓝、绿、红、透明度的顺序保存图片的颜色。设置了图片的 `fit` 时，图片保持比例并在方框中居中，否则拉伸以填满方框。布局只会传递 scheme 被 `layout::Options::image_schemes` 允许的 URL。没有 `icons` 或 `images` 时，图标和图片会被省略。

```rust
let o = Options {
    fonts,
    icons: Some(Box::new(icon)),
    // images 是已加载图片的 HashMap<String, Arc<RenderImage>>。
    images: Some(Box::new(move |src| images.get(src).cloned())),
    ..Options::default()
};
```

## 自定义绘制 {#custom-drawing}

`limu_gpui::paint_with` 用一个钩子代替默认方式绘制每个图元。钩子会收到一个 `Painter`、图元，以及类型为 `Resolved` 的样式，其中每种颜色都已经确定。painter 的 `item` 按默认方式绘制图元，`parts`、`ends`、`picture` 和 `label` 绘制默认的各个部分。它的 `canvas` 是 `GpuiCanvas`，其 `window` 给出窗口和应用，钩子可以直接用 GPUI 绘制。钩子要自己用传给 `paint_with` 的起点和缩放比例，把绘制内容放到窗口的像素坐标中。

```rust
use gpui::{Bounds, fill, point, px, size};
use limu::scene::Kind;
use limu_gpui::paint_with;

paint_with(&scene, &o, origin, scale, window, cx, |p, it, s| {
    if !matches!(it.kind, Kind::Node) {
        p.item(it, s);
        return;
    }
    // 把节点画成 GPUI 的 quad，标签按默认方式绘制。
    let b = it.bounds;
    let r = Bounds::new(
        point(origin.x + px(b.x as f32 * scale), origin.y + px(b.y as f32 * scale)),
        size(px(b.w as f32 * scale), px(b.h as f32 * scale)),
    );
    let (window, _) = p.canvas().window();
    window.paint_quad(fill(r, color(s.fill.color)).corner_radii(px(8.0 * scale)));
    p.label(it, s);
});
```

GPUI 没有图层，所以钩子收到的颜色已经包含了图元的不透明度。

limu-gpui 的 `viewer` 示例在窗口中展示 limu-rs 每个后端都会绘制的样例，是一个更完整的场景绘制示例。
