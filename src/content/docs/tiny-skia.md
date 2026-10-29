---
title: "tiny-skia"
description: "Draw diagrams into bitmaps and PNGs with tiny-skia, in fonts your program carries."
---

The limu-tiny-skia crate draws limu's scenes into [tiny-skia](https://github.com/linebender/tiny-skia) pixmaps, which it can save as PNGs. It needs no GPU and no system libraries, so it runs on servers, in command-line tools and anywhere else Rust builds. Text is shaped with [rustybuzz](https://github.com/harfbuzz/rustybuzz) in font files your program gives it, so a diagram comes out the same on every machine. limu-rs also uses it to draw the golden images that check its default drawing.

limu-rs is not released yet, and its API may change before 0.1.

## Installing

limu-tiny-skia is a crate of its own, which keeps limu and limu-scene free of anything beyond Rust's standard library. limu-rs isn't on crates.io yet, so add both crates from its repository.

```shell
cargo add limu --git https://github.com/firede/limu-rs
cargo add limu-tiny-skia --git https://github.com/firede/limu-rs
```

limu-tiny-skia re-exports the tiny-skia it draws with as `limu_tiny_skia::tiny_skia`, so you don't need to match its version. The examples below use `limu::scene`, which is the limu-scene crate as limu re-exports it.

## Drawing a PNG

`limu_tiny_skia::render` draws a scene into a new pixmap. Lay out the diagram with the same fonts you draw it in, as explained under [Fonts](#fonts).

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

The pixmap is as large as the scene times `Options.scale`, rounded up to whole pixels, and is filled with the theme's background. A scale of zero or less counts as 1. `render` returns `None` when the scene is too small or too large for a pixmap.

`Options.look` sets the theme and the overrides. See [Theming](/theming). When the look changes, draw the scene again. It doesn't need to be laid out again.

## Drawing into a pixmap of your own

`limu_tiny_skia::draw` draws a scene into a pixmap you already have. A `Transform` places the scene's units in the pixmap's pixels, so it decides where the diagram goes and how large it is. `draw` doesn't fill a background, and it ignores `Options.scale`.

```rust
use limu_tiny_skia::tiny_skia::{Color, Pixmap, Transform};

let mut pixmap = Pixmap::new(1200, 800).ok_or("no pixmap")?;
pixmap.fill(Color::WHITE);
// Each unit of the scene is 2 pixels, and its top left corner is at (40, 40).
let at = Transform::from_row(2.0, 0.0, 0.0, 2.0, 40.0, 40.0);
limu_tiny_skia::draw(&scene, &o, &mut pixmap.as_mut(), at);
```

limu-tiny-skia draws the same picture as the SVG writer, with one difference. When a corner radius is too large for a box, it uses the smaller of half the width and half the height. SVG uses elliptical corners instead. An item's opacity is drawn as a layer, a pixmap of its own laid over what is under it, as SVG draws a group at an opacity, so where an item's parts overlap, the lower part doesn't show through.

## Fonts

A diagram is laid out with a measurer and drawn with fonts. If the two don't match, text won't fit the space layout gave it. `limu_tiny_skia::Fonts` does both jobs. It implements limu's `Measurer`, and it measures text by shaping it with rustybuzz exactly as it's shaped for drawing.

`Fonts::new` takes the data of a TrueType or OpenType file as the regular font, and `set` adds a font for a face. The faces are bold, italic and mono, and any mix of them.

```rust
use limu::scene::text::Face;

let mut fonts = Fonts::new(std::fs::read("Inter-Regular.ttf")?)?;
fonts
    .set(Face::BOLD, std::fs::read("Inter-Bold.ttf")?)?
    .set(Face::ITALIC, std::fs::read("Inter-Italic.ttf")?)?
    .set(Face::BOLD | Face::ITALIC, std::fs::read("Inter-BoldItalic.ttf")?)?
    .set(Face::MONO, std::fs::read("JetBrainsMono-Regular.ttf")?)?;
```

Both return a `FontError` for data that isn't a font. Text in a face you gave no font for is set in the nearest one you did. limu-tiny-skia tries the face without italic, then without bold, and then takes the regular font. Without `Options.fonts`, text is left out.

Each face is set in its one font, with no fallback to others. A character the font doesn't have is drawn as the font's missing glyph. To draw Chinese, Japanese or Korean text, give fonts that cover those scripts. If you don't give layout a measurer, it measures text as Arial, so a diagram drawn in another font only fits when that font has Arial's widths, as Liberation Sans does.

Glyphs are drawn from their outlines, so a halo is stroked the way any path is. An underline follows the font's own position and thickness. Subscripts are lowered a fifth of the label's size and superscripts raised a third, about where a browser puts them.

## Icons and images

limu-tiny-skia never loads images or follows links on its own. Your program knows where its images come from, so it makes those decisions.

`Options.icons` gives an icon's parts by its name, such as `fa:fa-car`. Every backend of limu-rs takes icons in this one form, `limu::scene::Icons`, so you write an icon set once for all of them. The parts sit on a box of 24 by 24. A filled part is filled in the color of the item's text, and a stroked part is stroked in it, 2 wide with round ends and corners. Layout leaves room in labels only for icons you report through `layout::Options::icons`, so give both the same set.

`Options.images` gives a pixmap for an image's URL. When an image's `fit` is set, it keeps its proportions and is centered in its box. Otherwise it's stretched to fill the box. Layout only passes through URLs whose scheme `layout::Options::image_schemes` allows, and loading and caching the images is up to you. Without `icons` or `images`, icons and images are left out.

```rust
use limu::scene::{Painting, Part, Path};

// Icons on a box of 24 by 24, stroked 2 wide, as Lucide's are.
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
    // pixmaps is a HashMap<String, Pixmap> of the images loaded already.
    images: Some(Box::new(|src| pixmaps.get(src).cloned())),
    ..Options::default()
};
```

`Path::parse` reads SVG path data, so an icon set drawn on a box of 24 by 24 can be used as it is.

## Custom drawing

`limu_tiny_skia::draw_with` draws each item with a hook in place of the default. The hook receives a `Painter`, the item and its style as a `Resolved`, with every color already worked out. The painter's `item` draws the item the default way, and `parts`, `ends`, `picture` and `label` draw the default's pieces. Its `canvas` is a `PixmapCanvas`, whose `pixmap` and `transform` let the hook draw with tiny-skia directly.

```rust
use limu::scene::Kind;
use limu_tiny_skia::tiny_skia::{Paint, Rect, Transform};

limu_tiny_skia::draw_with(&scene, &o, &mut pixmap.as_mut(), Transform::identity(), |p, it, s| {
    if !matches!(it.kind, Kind::Node) {
        p.item(it, s);
        return;
    }
    // Draw the node as a square box of our own, and its label the default way.
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

The hook draws inside the layer of the item's opacity, so the style it receives is always opaque. `pixmap` gives what the hook draws on, which is that layer when the item has one, and `transform` places the scene's units in it.
