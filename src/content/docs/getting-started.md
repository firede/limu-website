---
title: "Getting started"
description: "Install limu, lay out a diagram, and render it as SVG."
---

limu turns Mermaid text into a scene, which records what each part of a diagram is and where it goes. A backend then draws the scene. This page uses the SVG backend, which needs only the standard library, as limu itself does. The examples are in Go and in Rust. The switch at the top of the page, or above any example, picks the language for the whole site.

## Installing

```shell for="go"
go get github.com/firede/limu
```

```shell for="rust"
cargo add limu
```

<div data-lang-only="go">

limu needs Go 1.27 or later.

</div>

<div data-lang-only="rust">

limu-rs needs Rust 1.95 or later. It's young, and its API will change in any 0.x release.

</div>

## Drawing a diagram

`go:limu.Layout` `rust:limu::layout` reads a diagram and lays it out, and `go:svg.Render` `rust:svg::render` writes the resulting scene as an SVG document.

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

By default, layout measures text with a table of Arial's character widths, `go:text.Arial` `rust:limu::layout::Arial`, so the SVG should set its text in Arial or a font of the same width. If you draw text in other fonts, measure it with those fonts instead. See [Measuring text](/api#measuring-text).

The theme sets the diagram's colors. The SVG backend writes them as CSS variables with the theme's colors as fallbacks, so a page can change them without rendering the diagram again. See [Theming](/theming).

## Errors

When limu can't read a diagram, it returns an error, a `go:*diagram.Error` `rust:limu::Error`. Its code says whether the type is unsupported, the text doesn't parse, or the text is over a limit. Its line and column give the position when there is one.

```go
sc, err := limu.Layout(src, nil)
var derr *diagram.Error
if errors.As(err, &derr) {
	fmt.Printf("%s at line %d: %s\n", derr.Code, derr.Line, derr.Message)
}
```

```rust
match limu::layout(src, &Default::default()) {
    Ok(scene) => draw(&scene),
    Err(e) => println!("{} at line {}: {}", e.code.as_str(), e.line, e.message),
}
```

Error messages can quote the diagram's text, so display them as text rather than markup.

## Fitting a width

Set the layout's maximum width, `go:layout.Options.MaxWidth` `rust:layout::Options::max_width`, to the width you have. Diagrams that can get narrower will, so a wide flowchart may switch from running across to running down. Diagrams that can't get narrower keep the width they need.

```go
sc, err := limu.Layout(src, &layout.Options{MaxWidth: 480})
```

```rust
let scene = limu::layout(
    src,
    &limu::layout::Options {
        max_width: 480.0,
        ..Default::default()
    },
)?;
```

The SVG is the size of the scene. To let a page scale it down further, give it `max-width: 100%` and `height: auto` in CSS.

## Laying out again

If you lay out the same diagram more than once, for example when the available width changes, parse it once with `go:limu.Parse` `rust:limu::parse` and lay out the result as often as you need. Layout doesn't change the parsed diagram, so it's safe to do from several goroutines or threads at once.

```go
d, err := limu.Parse(src, diagram.Options{})
if err != nil {
	return err
}
wide, err := d.Layout(&layout.Options{MaxWidth: 640})
narrow, err := d.Layout(&layout.Options{MaxWidth: 320})
```

```rust
use limu::layout::Options;

let d = limu::parse(src, &limu::ParseOptions::default())?;
let wide = d.layout(&Options { max_width: 640.0, ..Default::default() })?;
let narrow = d.layout(&Options { max_width: 320.0, ..Default::default() })?;
```

Changing the theme doesn't need a new layout at all. Draw the same scene in the new theme.

## Diagram types

limu supports every diagram type that Pele draws, which covers every type built into Mermaid. `go:limu.Types` `rust:limu::types` lists them. `go:limu.Supports` `rust:limu::supports` checks a text's declared type without parsing the rest.

```go
if !limu.Supports(src) {
	// Show the text as code instead.
}
```

```rust
if !limu::supports(src) {
    // Show the text as code instead.
}
```

<div data-lang-only="rust">

The `limu` crate has a feature for each diagram type, and all of them are on by default. A program that reads only some types can set `default-features = false` and turn on the features of the types it reads, such as `flowchart` and `sequence`. Text of a type whose feature is off is an unsupported diagram.

</div>

[Examples](/examples) shows each type, and [Compatibility](/compatibility) lists the keywords that declare them.

## Next steps

- [API](/api) covers parsing and layout options, limits and the scene.
- [Theming](/theming) covers themes, per-role overrides and custom drawing.
- [SVG](/svg) covers CSS variables, classes and untrusted diagrams.
- The backends draw diagrams natively. In Go, [MyGo](/mygo) draws on the GPU and finds the part under the pointer. In Rust, [tiny-skia](/tiny-skia) draws into a bitmap, [Core Graphics](/core-graphics) draws on Apple's platforms, [GPUI](/gpui) draws in a GPUI window, and [Terminal](/terminal) draws in a terminal's cells.
