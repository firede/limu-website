---
title: "GPUI"
description: "Paint diagrams in GPUI windows, measure their text with GPUI's text system, and find the part under the pointer."
---

The limu-gpui crate paints limu's scenes in [GPUI](https://www.gpui.rs) windows, the UI framework Zed is built with. A scene is painted during an element's paint phase, on the GPU along with the rest of the window. Text is measured and set by GPUI's own text system, so a diagram uses your app's fonts. limu-scene finds the item under the pointer, so a diagram in a window can answer clicks.

limu-rs is not released yet, and its API may change before 0.1.

## Installing

limu-gpui builds on [gpui-fast](https://github.com/longbridge/gpui-fast) 0.1.12, a fork of Zed's GPUI published on crates.io, and your app needs the same. gpui-fast asks to be named `gpui` in `Cargo.toml`, so the paths its macros write resolve. On macOS, GPUI sets text only with the `font-kit` feature of gpui-fast-platform. Without it every glyph is missing. limu-rs isn't on crates.io yet, so add limu and limu-gpui from its repository.

```toml
[dependencies]
gpui = { package = "gpui-fast", version = "0.1.12" }
gpui_platform = { package = "gpui-fast-platform", version = "0.1.12", features = ["font-kit"] }
limu = { git = "https://github.com/firede/limu-rs" }
limu-gpui = { git = "https://github.com/firede/limu-rs" }
```

In limu-rs's repository, limu-gpui is a workspace of its own, in `crates/limu-gpui`. GPUI takes long to build and builds only where it has a platform, so the other crates' checks leave it out. The examples below use `limu::scene`, which is the limu-scene crate as limu re-exports it.

## Showing a diagram

`limu_gpui::paint` paints a scene with its top left corner at a point of the window, each of its units a number of pixels. Call it in the paint closure of a `canvas` element, or in the paint phase of an element of your own. Lay out the diagram with the window's text system, as explained under [Fonts](#fonts).

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
        // Text is measured by the window's text system, in the fonts it is drawn in.
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

/// A color of limu's as GPUI's.
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

`paint` leaves the scene's background to you, so the example fills the element with the theme's. `Options.look` sets the theme and the overrides. See [Theming](/theming). When the look changes, for example when the window switches to dark mode, the scene is only painted again.

To zoom or pan, change the scale and the point you paint at. To fit a diagram to its element, lay it out again with a new `max_width` when the element's width changes. A `TextMeasurer` can be cloned and kept for that. Parse the text once with `limu::parse`, and lay the diagram out from the `Diagram` it gives.

### Finding the item under the pointer

`Scene::item_at` finds the item at a point in the scene's units and returns its index in `scene.items`. When several items overlap, it returns the one drawn last, which is the one on top. A point hits an item when it's inside the item's box or its label's box. Edges and items made only of lines are hit when the point is within a slop of a line or inside one of their markers.

To use it in a window, turn the pointer's position back into the scene's units with the origin and scale you painted at. This listener goes in the canvas's paint closure, after `paint`, where `scale` is the scale given to `paint` and `this` is `cx.entity()`, taken in `render`.

```rust
window.on_mouse_event(move |e: &MouseDownEvent, phase, _, cx| {
    if phase != DispatchPhase::Bubble || e.button != MouseButton::Left {
        return;
    }
    // The pointer in the scene's units.
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

The slop here is 4 pixels, given in the scene's units. An item's `tooltip` holds the text to show when it's pointed at, and its `link` holds where it leads. limu-gpui opens no links on its own. Open them the same way your app opens any other link, or don't.

## Fonts

A diagram is laid out with a measurer and drawn with fonts. If the two don't match, text won't fit the space layout gave it. `limu_gpui::Fonts` names two families, `sans` for text and `mono` for monospaced text, and bold and italic text is set in the family's bold and italic faces. Its default is Arial and Courier New, the faces limu measures in when it's given no measurer.

`TextMeasurer` measures text as a window's text system sets it in the fonts. It needs a window, so lay a diagram out once you have one, for example when the window's view is made. Give the measurer and `Options.fonts` the same families.

```rust
let fonts = Fonts {
    sans: "Inter".into(),
    mono: "JetBrains Mono".into(),
};
let measurer = TextMeasurer::new(window, fonts.clone());
// Lay out with the measurer, and paint with Options { fonts, .. }.
```

Upright text that is filled is shaped by the same text system the measurer uses, and painted glyph by glyph on its baseline. GPUI paints a glyph only upright and only filled, so two kinds of text take another way. A label limu turns, such as an axis title or a swimlane's name, and the halo drawn about a label's letters are written as SVG text, which GPUI's SVG renderer draws as a mask and turns as it turns icons. That text is shaped by usvg rather than by GPUI's text system, in the system's fonts and the fonts your app bundles as assets. A family you only add to GPUI's text system isn't found there.

## What GPUI draws differently

limu-gpui draws the same picture as the SVG writer, as far as GPUI lets it.

- GPUI has no layers drawn apart, so limu-gpui applies an item's opacity to each of its colors. Where an item's parts overlap, the lower part shows through.
- Images are drawn opaque, as GPUI draws images.
- GPUI keeps a font's metrics to itself, so an underline is drawn a tenth of the text's size below the baseline and a fifteenth of it thick.
- When a corner radius is too large for a box, limu-gpui uses the smaller of half the width and half the height. SVG uses elliptical corners instead.

Paths are tessellated by GPUI, filled by the nonzero rule, and stroked with SVG's caps, joins and miter limit.

## Icons and images

limu-gpui never loads images on its own. Your app knows where its images come from, so it makes those decisions.

`Options.icons` gives an icon's parts by its name, such as `fa:fa-car`. Every backend of limu-rs takes icons in this one form, `limu::scene::Icons`, so the icon set written for [tiny-skia](/tiny-skia#icons-and-images) works here as it is. The parts sit on a box of 24 by 24. A filled part is filled in the color of the item's text, and a stroked part is stroked in it, 2 wide with round ends and corners. Layout leaves room in labels only for icons you report through `layout::Options::icons`, so give both the same set.

`Options.images` gives a GPUI `RenderImage` for an image's URL. GPUI keeps an image's colors in the order blue, green, red, alpha. When an image's `fit` is set, it keeps its proportions and is centered in its box. Otherwise it's stretched to fill the box. Layout only passes through URLs whose scheme `layout::Options::image_schemes` allows. Without `icons` or `images`, icons and images are left out.

```rust
let o = Options {
    fonts,
    icons: Some(Box::new(icon)),
    // images is a HashMap<String, Arc<RenderImage>> of the images loaded already.
    images: Some(Box::new(move |src| images.get(src).cloned())),
    ..Options::default()
};
```

## Custom drawing

`limu_gpui::paint_with` paints each item with a hook in place of the default. The hook receives a `Painter`, the item and its style as a `Resolved`, with every color already worked out. The painter's `item` paints the item the default way, and `parts`, `ends`, `picture` and `label` paint the default's pieces. Its `canvas` is a `GpuiCanvas`, whose `window` gives the window and the app, so the hook can paint with GPUI directly. The hook places what it paints in the window's pixels itself, with the origin and scale it gave `paint_with`.

```rust
use gpui::{Bounds, fill, point, px, size};
use limu::scene::Kind;
use limu_gpui::paint_with;

paint_with(&scene, &o, origin, scale, window, cx, |p, it, s| {
    if !matches!(it.kind, Kind::Node) {
        p.item(it, s);
        return;
    }
    // Paint the node as a quad of GPUI's, and its label the default way.
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

GPUI has no layers, so the colors the hook receives have the item's opacity in them already.

limu-gpui's `viewer` example shows the samples every backend of limu-rs draws in a window, and is a fuller example of painting a scene.
