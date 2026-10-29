---
title: "Core Graphics"
description: "Draw diagrams with Core Graphics on Apple's platforms, and measure their text with Core Text."
---

The limu-coregraphics crate draws limu's scenes with Core Graphics, into a `CGContext` your app gives it or into a `CGImage` it makes. Text is shaped by Core Text, as the rest of an app's text is on Apple's platforms, so a diagram uses the system's fonts or the fonts your app carries. It suits apps on macOS and iOS that draw in views of their own, through AppKit, UIKit or another toolkit that hands out a `CGContext`.

limu-rs is young, and its API will change in any 0.x release.

## Installing

limu-coregraphics is a crate of its own, which keeps limu and limu-scene free of anything beyond Rust's standard library. Add both crates.

```shell
cargo add limu limu-coregraphics
```

The crate calls Core Graphics and Core Text through objc2's bindings, and re-exports them as `limu_coregraphics::objc2_core_foundation`, `objc2_core_graphics` and `objc2_core_text`. It is empty on platforms other than Apple's, so a project that builds for other platforms too can depend on it everywhere. The examples below use `limu::scene`, which is the limu-scene crate as limu re-exports it.

## Drawing an image

`limu_coregraphics::render` draws a scene into a new image. Lay out the diagram with the same fonts you draw it in, as explained under [Fonts](#fonts).

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

The image is in sRGB, as large as the scene times `Options.scale`, rounded up to whole pixels, and filled with the theme's background. A scale of zero or less counts as 1. `render` returns `None` when the scene is too small or too large for an image. Show the image in a view or a layer, or write it to a file with Image I/O.

`Options.look` sets the theme and the overrides. See [Theming](/theming). When the look changes, for example when the system switches to dark mode, draw the scene again. It doesn't need to be laid out again.

## Drawing in a view

`limu_coregraphics::draw` draws a scene into a context you give it, in the context's user space, with y running down. A flipped view's context is set up this way already, so in a flipped `NSView`, or in a `UIView`, draw straight into the context of `draw(_:)`. Scale the context first to zoom.

```rust
use limu_coregraphics::objc2_core_graphics::CGContext;

/// Draws a scene in a view's context, zoomed. A flipped view's context is y down, as
/// the scene is.
fn draw_zoomed(cx: &CGContext, scene: &Scene, o: &Options<'_>, zoom: f64) {
    CGContext::save_g_state(Some(cx));
    CGContext::scale_ctm(Some(cx), zoom, zoom);
    limu_coregraphics::draw(scene, o, cx);
    CGContext::restore_g_state(Some(cx));
}
```

A context whose y runs up, such as a bitmap context's or an unflipped view's, needs to be turned over first, as `render` does with its own.

```rust
// A context whose y runs up, height units high, is turned over first.
CGContext::translate_ctm(Some(cx), 0.0, height);
CGContext::scale_ctm(Some(cx), 1.0, -1.0);
```

`draw` doesn't fill a background, and it ignores `Options.scale`. It leaves the context's state as it found it.

limu-coregraphics draws the same picture as the SVG writer, with one difference. When a corner radius is too large for a box, it uses the smaller of half the width and half the height. SVG uses elliptical corners instead. An item's opacity is drawn as a transparency layer, as SVG draws a group at an opacity, so where an item's parts overlap, the lower part doesn't show through.

## Fonts

A diagram is laid out with a measurer and drawn with fonts. If the two don't match, text won't fit the space layout gave it. `limu_coregraphics::Fonts` does both jobs. It implements limu's `Measurer`, and it measures each line as Core Text sets it for drawing.

`Fonts::from_data` takes the data of a TrueType or OpenType file as the regular font, for an app that carries its fonts, and `set_data` adds a font for a face. They return a `FontError` for data that isn't a font. `Fonts::new` and `set` take a `CTFont` instead, for the system's fonts. The faces are bold, italic and mono, and any mix of them.

```rust
use limu::scene::text::Face;
use limu_coregraphics::Fonts;
use limu_coregraphics::objc2_core_foundation::{CFRetained, CFString};
use limu_coregraphics::objc2_core_text::CTFont;

fn font(name: &str) -> CFRetained<CTFont> {
    // SAFETY: a null matrix stands for the identity.
    unsafe { CTFont::with_name(&CFString::from_str(name), 12.0, std::ptr::null()) }
}

let mut fonts = Fonts::new(font("Helvetica"));
fonts
    .set(Face::BOLD, font("Helvetica-Bold"))
    .set(Face::ITALIC, font("Helvetica-Oblique"))
    .set(Face::MONO, font("Menlo-Regular"));
```

The size a font was made at doesn't matter, because text is set at the size its label asks for. Text in a face you gave no font for is set in the nearest one you did. limu-coregraphics tries the face without italic, then without bold, and then takes the regular font. Without `Options.fonts`, text is left out. If you don't give layout a measurer, it measures text as Arial, so a diagram drawn in another font only fits when that font has Arial's widths.

Core Text falls back to the system's fonts for characters the font doesn't have, such as Chinese, Japanese or Korean in a Latin font. `Fonts` measures the line with the fallback fonts in it, so that text fits too. Glyphs are drawn from their outlines, so a halo is stroked the way any path is. An underline follows the font's own position and thickness. Subscripts are lowered a fifth of the label's size and superscripts raised a third, about where a browser puts them.

## Icons and images

limu-coregraphics never loads images or follows links on its own. Your app knows where its images come from, so it makes those decisions.

`Options.icons` gives an icon's parts by its name, such as `fa:fa-car`. Every backend of limu-rs takes icons in this one form, `limu::scene::Icons`, so the icon set written for [tiny-skia](/tiny-skia#icons-and-images) works here as it is. The parts sit on a box of 24 by 24. A filled part is filled in the color of the item's text, and a stroked part is stroked in it, 2 wide with round ends and corners. Layout leaves room in labels only for icons you report through `layout::Options::icons`, so give both the same set.

`Options.images` gives a `CGImage` for an image's URL. When an image's `fit` is set, it keeps its proportions and is centered in its box. Otherwise it's stretched to fill the box. Layout only passes through URLs whose scheme `layout::Options::image_schemes` allows, and loading and caching the images is up to you. Without `icons` or `images`, icons and images are left out.

```rust
let o = Options {
    fonts: Some(&fonts),
    icons: Some(Box::new(icon)),
    // images is a HashMap<String, CFRetained<CGImage>> of the images loaded already.
    images: Some(Box::new(|src| images.get(src).cloned())),
    ..Options::default()
};
```

When an item with a link is clicked, its `link` field holds the target. Open it the same way your app opens any other link, or don't. `Scene::item_at` finds the item at a point in the scene's units, as described on the [GPUI](/gpui#finding-the-item-under-the-pointer) page.

## Custom drawing

`limu_coregraphics::draw_with` draws each item with a hook in place of the default. The hook receives a `Painter`, the item and its style as a `Resolved`, with every color already worked out. The painter's `item` draws the item the default way, and `parts`, `ends`, `picture` and `label` draw the default's pieces. Its `canvas` is a `ContextCanvas`, whose `context` lets the hook draw with Core Graphics directly, in the scene's units.

```rust
use limu::scene::Kind;
use limu_coregraphics::objc2_core_foundation::{CGPoint, CGRect, CGSize};
use limu_coregraphics::objc2_core_graphics::CGContext;

limu_coregraphics::draw_with(&scene, &o, cx, |p, it, s| {
    if !matches!(it.kind, Kind::Node) {
        p.item(it, s);
        return;
    }
    // Draw the node as a square box of our own, and its label the default way.
    let cx = Some(p.canvas().context());
    let (b, c) = (it.bounds, s.fill.color);
    let k = |v: u8| f64::from(v) / 255.0;
    CGContext::set_rgb_fill_color(cx, k(c.r), k(c.g), k(c.b), k(c.a));
    CGContext::fill_rect(cx, CGRect::new(CGPoint::new(b.x, b.y), CGSize::new(b.w, b.h)));
    p.label(it, s);
});
```

The hook draws inside the transparency layer of the item's opacity, so the style it receives is always opaque.
