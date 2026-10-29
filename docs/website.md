# Website

This document describes the website of limu and limu-rs,
[limu.firede.com](https://limu.firede.com), for people who work on it.

## Build and hosting

The site is built with Astro, as Pele's is, from this repository, which is the website of
limu and limu-rs and nothing else. It was `website/` in limu's repository until 2026-10-29, and its history came
with it. Cloudflare serves it as the static assets of a Worker, as it serves mygo-platinum's
site. A push to main deploys it (`.github/workflows/site.yml`), and `pnpm run deploy`
deploys it by hand. The site is in English only. The import path stays
`github.com/firede/limu`, so the site's domain isn't a vanity import path.

The site shows a release of limu, never limu's main branch. `go.mod` requires the release of
limu that `gen` draws with, and requires limumygo's playground as a tool at the release the
playground is built from. Moving the site to a new release is a change to `go.mod`, and
pushing it deploys the site. Each day, and by hand, `.github/workflows/releases.yml` checks
that `go.mod` requires the latest releases, and fails when it doesn't, so a release the site
hasn't followed shows as a failed check. To build the site with an unreleased limu, put a
`go.work` beside `go.mod` that uses this module and limu's checkouts, as
`go work init . ../limu ../limu/limumygo`. Git ignores it.

limu-rs is shown the same way. `limu-rs.json` names the repository and the tag the Rust
playground is built from, and the daily check fails when limu-rs has a newer tag. `LIMU_RS`, set to a checkout, builds the Rust playground from that checkout instead.
The diagrams the site draws are drawn by limu in Go. limu-rs lays them out to the same bit,
so the site doesn't draw them twice.

A Go program, `gen`, runs before Astro builds and writes what the site shows of limu's own
work.

- The mark and the icon.
- The SVG of every example, drawn by the svg package.
- The SVG of each Mermaid code block a document marks `draw`, such as
  ` ```mermaid draw title="limu" mark="scene" `. The page shows the drawing in place of the
  code block, and the Markdown keeps the source.
- `style.Kohu` and `style.KohuDark` as the `--limu-*` variables, so the diagrams follow the
  site's theme and the theme's colors are written in one place.
- The words of Mermaid that code blocks highlight, from limumygo's `mermaid` package, which
  the playground's editor highlights too.

The module's path is `github.com/firede/limu/website`, under limu's, because `gen` reads the
examples from limu's `internal/gallery`, which Go lets only paths under limu's import. The
PNG icons are drawn from the SVGs by headless Chrome and committed (`scripts/icons.mjs`). No
page but the playgrounds loads WebAssembly.

The diagrams' text is set in Arial, or a font of the same width, because layout measures it
with `text.Arial`. Setting it in Hanken Grotesk, like the rest of the site, would need a
`text.Measurer` that reads that font's advances, which nobody has written yet.

The site's layout, navigation, code blocks and Markdown pages are adapted from Pele's
website under its MIT license, which `PELE-LICENSE` holds.

## Pages

As on Pele's site, a sidebar lists the pages, from the home page (Introduction) to the
documents, and on a narrow screen they're in a menu. The mark and the name head the
sidebar, with the switch between Rust and Go after the name and the playground's button
below them. The GitHub link and the switch between light and dark are in the top right
corner. The footer
lists the pages again in four groups, Start, Guides, Backends and Project. There is no search, and no page comparing limu with Pele
or Mermaid, since limu matches Pele number for number.

### Two languages

The site is one site for both ports. They lay diagrams out alike and differ in their API
and their backends, so each page is written once, and what differs is written for each
language. A reader picks the language once, Rust or Go, in the switch after the site's name or
in the one above any example, and the whole site follows. Each switch lists Rust first.
Rust is the language until another is picked, and the links to the playground and to GitHub
are Rust's in the page as built. The
choice is kept in the browser as `limu-lang`, and a script in the head sets it on the root
as `data-lang` before the page is drawn, so the page never shows the other language first.
CSS hides whatever is marked for the other language. The links to the playground go to the
language's playground, and the header's GitHub link to its repository.

Wherever both languages are named, Rust comes first, in the switches, in the documents'
Markdown and in their prose. A document marks what is for one language in three ways.

- Code blocks of Rust and Go next to each other become one example with a switch. A block
  of another language joins them with `for="rust"` or `for="go"`, as the two commands that
  install limu do.
- An inline name written `` `rust:limu::layout` `` or `` `go:limu.Layout` `` shows for its
  language alone. A sentence that names a thing in both gives both, side by side.
- A paragraph, a list or a table for one language goes in a `<div data-lang-only="rust">`,
  with blank lines around its Markdown.

The pages of a backend that only one language has are listed for both readers, with a badge
that names the language. The Markdown a page is also served as keeps both languages, and
writes each inline name with its language in words.

### Home

The home page says what limu is for, which is drawing diagrams natively. Its code comes
first with the native backends of the language read, GPUI, tiny-skia and the terminal for
Rust, and MyGo for Go, with SVG last. It credits Pele, which both ports follow.

Its section on how limu works has three pictures, which the Architecture page also shows.

1. **Where the pipeline branches.** A renderer of SVG goes from text to a layout to an SVG
   string to a browser. limu goes from text to a layout to a scene and branches there, to
   SVG, to GPUI or MyGo on the GPU, to tiny-skia or Core Graphics, or to a backend of the
   host's own. `gen` draws this picture with
   the svg package, as two diagrams, with limu's scene in the accent color.
2. **One scene, laid out once and drawn four ways**, lined up so that the geometry matches.
   The first is the scene as data, with each item's box, parts, route and label box and no
   style. Then come the scene in Kohu, in KohuDark, which changes only the colors, and as
   Liquid Glass. The last is an `Options.Draw` of its own that draws each node and edge
   label as a pane of MyGo's glass, which bends what is under it at its rim, as SVG in a
   browser hardly can. The picture shows that a diagram is laid out once, that a change of
   style only redraws, and how far a backend's own drawing reaches. mygo-platinum's
   Platinum look was dropped from it, because it measures text in its own bitmap faces and
   so lays the diagram out again, and because it depends on limu.

limu's `limumygo/examples/pictures` draws the second picture into this repository's
`public/pictures`. The
scene is SVG in `currentColor`, so it takes the page's color, and the other three are PNG at
twice their size. `lib/pictures.mjs` writes them as a figure. The home page shows it, and so
does any document with a paragraph of nothing but those images, as Architecture has.

The third shows how far a backend can go. It's the same flowchart in
mygo-platinum's Platinum look, laid out again because the look measures text in its own
bitmap faces, and drawn a pixel at a time in a window of the look. mygo-platinum depends on
limu, so the picture is drawn there and only the PNG is committed here, as
`public/pictures/platinum.png`. To draw it again, write the flowchart of
`limumygo/examples/pictures` to `review.mmd` and run this in mygo-platinum.

```sh
go run ./examples/diagrams -src review.mmd -png platinum.png -frame Review -scale 2
```

After the pictures come the code, with a switch among the backends of the language read,
then cards linking to the examples, the playground, Getting started and Theming, and a
paragraph on limu-rs, limu and Pele.

### Social pictures

Given the site's font, Hanken Grotesk, as a TrueType file, the same program draws the
picture a link to the site shows. It's set under the sea that limu is named for.

- The water is drawn by a MyGo shader, light near the surface, with shafts of light and
  the caustics the surface throws.
- Limu kohu, drawn with limu's mark, grows from the floor.
- On the left are limu's name, the lede's first sentence, which names Rust and Go, a line
  on drawing natively, in a terminal or as SVG, and the address.
- On the right is how limu works (Mermaid, layout, the scene, Native and SVG), laid out by
  limu from the bottom up and drawn as bubbles of clear glass that rise from the limu and
  bend the light behind them.

`og.png`, 1200 by 630, is every page's `og:image` and `twitter:image`, with a large card.
`github.png`, 1280 by 640, is the repository's social preview, which GitHub takes only
through its settings. The font isn't in the repository. The program reads the file it's
given, as Google Fonts serves it.

The natively drawn pictures are rendered with `ui.Render`, as limumygo's tests render
theirs, on a Mac, and committed. MyGo sets text with Pango on Linux, so CI would draw them
differently.

### Examples

`/examples` shows the featured examples of each type, and `/examples/<type>` shows every
example of a type. They come from limu's gallery, limu's `internal/gallery`, which the playground
shows too. The examples are limu's own, three to seven for each of the 32 types, one
Markdown file per type. The first one or two of each are featured and draw a scene a reader
could meet, and each of the others shows another feature of the type. They are mostly
scenes developers know, with the odd one from the sea, and none uses "Label", "A" or
"Alice" as filler. Four are written in Chinese, Japanese and Korean (a flowchart, a sequence
diagram, a mindmap and an entity relationship diagram), so text in those scripts is laid
out and drawn whenever the examples are. The examples from Mermaid's documentation, which
the playground used to show, stay in limu's tests.

Each diagram is SVG written at build time, with "Copy source" and "Open in playground" next
to it. A switch draws the examples in Kohu, KohuDark or Default. The SVG's colors are the
`--limu-*` variables, so switching lays nothing out again. Until a theme is chosen, the
examples follow the page's, Kohu in the light and KohuDark in the dark, and a choice is
remembered as the page's own theme is.

As on Pele's site, each diagram is laid out at most 640, 480 and 320 wide, and the page
shows the widest that fits. On a phone, a diagram that can draw itself narrower does so,
rather than shrinking its text. Gantt charts take 2026-01-15 in UTC as the present, so the
build writes the same SVG whenever it runs.

"Open in playground" links to `/playground#source=…`, with the source in the fragment
encoded as a URL query, which is how Pele's playground takes it too. A source whose link
would pass 32,000 characters gets no such link.

### Playground

`/playground` is the playground compiled to WebAssembly. It runs as an application of its
own, filling the window under a narrow bar with the wordmark, links to the examples and the
documents, and the header's icons, without the documents' layout. `pnpm playground`
(`scripts/playground.mjs`) builds it into `public/assets/playground/go`, which isn't committed, and
writes the files' names and size to `src/generated/playground.json`. `pnpm build` doesn't
build it, so a change to the documents doesn't compile it again, and fails if it hasn't
been built. `pnpm run deploy` builds both and deploys them.

The web playground and the desktop one are one program, so they can't drift apart. It's a
place to try limu, not a full application. It has the editor, the diagram and its SVG,
light and dark, a link to share, SVG and PNG downloads, and an Examples menu of limu's
gallery. It has no opening or saving of files and no page of examples, and its colors are
the site's, from `base.scss`. `gen`'s TestPalettes holds the playground of the release
`go.mod` requires to them. A diagram comes in through the
URL, as in Pele's playground, and Copy link writes one. Without a page of examples, the
playground needs no router, which in a browser would take over the URL's fragment.

Build tags separate the desktop shell from the browser's (`desktop.go`, `web.go`). On the
desktop, it downloads through a dialog, offers the appearance in a menu, remembers the text
and links to the site. In a browser, it downloads as a link with `download` does, and
follows the page's light or dark switch through `data-mygo-theme`. MyGo draws its menus in a
browser as HTML in macOS's colors for the system's appearance, which the switch doesn't
reach, so the page restyles them in the site's colors. Below 640 pixels, the text goes above
the diagram.

The WebAssembly is heavy, and the first load is what it costs. Compiling it and starting
limu take tens of milliseconds, but downloading it takes seconds. So the page that loads it
is plain HTML that shows the diagram's source from the URL right away, where the editor will
be, along with the download's progress. The files are named by their content and cached for
good (`public/_headers`), so a second visit starts at once. Measured on 2026-10-20, built
with `GOOS=js GOARCH=wasm go build -trimpath -tags mygo_noinspector -ldflags="-s -w"`.

| Build | Size | gzip | brotli |
|---|---|---|---|
| the playground | 23.9 MB (22.8 MiB) | 6.1 MB | 4.4 MB |
| limu and svg alone | 12.2 MB | 3.3 MB | 2.3 MB |

Of the playground's 16.7 MB of code, limu's diagrams are 6.1 MB, Go's runtime and standard
library 5.5 MB, MyGo 4.0 MB (2.3 MB of it its `ui` and `editor`), and limu's other packages
0.7 MB. The rest of the file is 7.7 MB of data. Cloudflare serves assets of at most 25 MiB
and compresses `application/wasm`. The playground's build and the site's fail when the
WebAssembly passes 24 MiB. Past 25 MiB, it would have to be served from R2.

`/playground/rust` is limu-rs's playground. limu-rs builds it from its `limu-playground`
crate, a module of WebAssembly with no imports, and `limu.js`, the script a page calls it
through. The site builds both with limu-rs's own `scripts/playground.sh`, at the tag
`limu-rs.json` names (`scripts/playground-rust.mjs`), into
`public/assets/playground/rust`. The page is written by the site, under the same narrow bar.
It has the text, an Examples menu of limu's gallery, a link to share, and the diagram as SVG,
as text for a terminal, or as its scene. The SVG is inlined with the `--limu-*` variables,
so it follows the site's light or dark switch. The module is 3.3 MB, 1.1 MB with gzip, a
seventh of the Go playground's, and the page lays the text out as it's typed. Both playgrounds take a
diagram from `#source=…`, and the links in their bars move between them with the text.

### Documents

| Page | What it covers |
|---|---|
| Getting started | Installing, then laying out and rendering SVG, which need only the standard library. Parsing once and laying out many times, as when the width changes. Listing and checking the types, and in Rust, the feature of each type. |
| API | The packages of limu, or the crates of limu-rs. The parsing options, with the configuration and the limits, and what to set them to for untrusted text. The error codes. The layout options. The scene, in enough detail to walk it. Measuring text with a measurer and the table of Arial's widths. The Go page links to pkg.go.dev rather than repeating it, and limu-rs's to docs.rs. |
| Theming | The three levels of style, with the tokens and values of Kohu, KohuDark and Pele's theme, overrides by role, and a backend's own drawing. Styles an author writes in the diagram with `classDef` and `style`. |
| SVG | The SVG backend and its options, the fonts, icon markup, and drawing items with a function of one's own. Setting the `--limu-*` variables in a page. Untrusted diagrams, with the schemes links and images may use and where icon markup comes from. |
| tiny-skia | Rust alone. Drawing into a new pixmap and into one of the host's. `Fonts` from font files, with no fallback. Icons and images. Drawing items with a hook of one's own. |
| Core Graphics | Rust alone, on Apple's platforms. Drawing into an image and into a view's context. `Fonts` from Core Text or font data. Icons and images. A hook of one's own. |
| GPUI | Rust alone. The dependencies GPUI needs. Painting in a window, and finding the item under the pointer. Measuring with GPUI's text system, and the text it paints otherwise. Icons, images and a hook of one's own. |
| Terminal | Rust alone. Laying out for a terminal's cells and drawing in them, in box-drawing characters or ASCII. The diagrams it doesn't draw, and wide characters. |
| MyGo | Go alone. Installing limumygo. `View`, and finding the item under the pointer with `ItemAt`. `Paint` on a `Painter`. `Fonts`, which measure and draw in the same fonts. `DrawIcon` and `DrawImage`. The editor's language in `limumygo/mermaid`. Running in a browser. limumygo loads no image and follows no link, and the host decides through `DrawImage` and the pointer's events. |
| Architecture | The stages, and what belongs to layout and what to style. How a backend walks the scene, enough for an agent to write one from there. The two pictures of the home page. How both ports follow Pele and are checked against it, and where limu-rs is built otherwise. It's the short form of both design documents. |
| Compatibility | The types limu reads. Where it differs from Pele, such as what it doesn't port (`mount`, zoom) and differences of the platform. Where it differs from Mermaid, mostly as Pele does. How to report a difference, to the port it's in. |

The backends come after SVG, limu-rs's first and then MyGo, each with a badge of its language.

Two things about Chinese, Japanese and Korean text are in the documents. The API page says
that `text.Arial` only estimates such text, at an em per character, and wraps Chinese and
Japanese between characters as Pele does. The MyGo page says that `Fonts` measure it in the
fonts it's drawn in, and that the system's text engine adds a little room where Han
characters meet Latin letters and digits, which `Fonts` measure too.

Every page is also served as Markdown at its path plus `.md`, and `/llms.txt` lists them for
agents. The site has a sitemap, a `robots.txt` and a 404 page.

## Look

The site's colors are those of limu kohu, the red limu of Hawaiʻi, in a tide pool, and its
type is Hanken Grotesk. Both set it apart from Pele's site, which is dark only, in
Flexoki's warm near-black with a neutral accent.

### Colors

The site has a light and a dark theme, which follow the system and can be switched.

| | Dark | Light |
|---|---|---|
| page | `#0c1618` | `#f1f6f5` |
| panel (code, cards) | `#132125` | `#e3edeb` |
| rule | `#213439` | `#cddcda` |
| text | `#d0dddc` | `#0f262a` |
| muted text | `#7f989b` | `#536f72` |
| accent (links, the mark) | `#ee8494` | `#a92e4a` |

The same colors make a pair of themes in the style package, `style.Kohu()` and
`style.KohuDark()`. `style.Default()` stays Pele's light theme.

| Token | `KohuDark` | `Kohu` |
|---|---|---|
| `Bg` | `#0c1618` | `#f1f6f5` |
| `Fg` | `#d0dddc` | `#0f262a` |
| `Muted` | `#7f989b` | `#536f72` |
| `Line` | `#b4c7c7` | `#23393d` |
| `Surface` | `#142428` | `#e5eeec` |
| `SurfaceAlt` | `#1b2f34` | `#d6e4e2` |
| `Border` | `#557176` | `#76939a` |
| `Accent` | `#ee8494` | `#a92e4a` |
| `Critical` | `#e3a040` | `#b0611a` |
| `Series` | `#8cbf6a` `#e37d90` `#5cbcb3` `#d9a748` `#78a3d9` `#ad92d1` `#e693b3` `#b9a272` | `#4f8a3a` `#b5435c` `#23817d` `#a8761c` `#3d6aa3` `#7b5aa0` `#c0668a` `#7d6a3f` |

`Radius` and `StrokeWidth` are Default's, 4 and 1. `Critical` is amber rather than red, so
it isn't mistaken for the accent. The eight series are colors of algae, namely sea lettuce,
limu kohu, the tide pool's teal, kelp's gold, deep water, dulse, coralline and olive. In both
themes, text has a contrast of at least 7:1 against the page and surfaces, muted text,
links and lines at least 4.5:1, the series at least 3:1 against `Surface`, and outlines at
least 2.5:1 against it (WCAG 2).

### Mark and icon

The mark is the plume of limu kohu in one color, the accent of whatever it's on, as
`currentColor`.

On a 64 box, its stem is the cubic from (31, 60) through (28.5, 45) and (36.5, 29) to
(33, 5), 4.6 wide at its foot and 2.6 at its tip. Seven branchlets leave it, alternating and
starting on the left, at t = 0.18, 0.31, 0.44, 0.57, 0.69, 0.80 and 0.89, with lengths 17.5,
16.5, 14.5, 12.5, 10, 7.5 and 5. A branchlet of length L that leaves the stem at (x, y) to
side s (−1 for left, 1 for right) is the cubic from (x, y) through (x + 0.36sL, y − 0.14L)
and (x + 0.64sL, y − 0.34L) to (x + 0.78sL, y − 0.68L). It's 3.4 − 1.2t wide where it leaves
and 2 at its tip. Every stroke tapers evenly and ends round. The plume is centered in its
box by its bounds, then moved 0.6 to the right.

At 16 pixels the mark has a cut of its own, on a 16 box. Its stem goes from (8, 15) through
(7.4, 11) and (9.1, 7) to (8.4, 1.2) and is 1.9 wide. Three branchlets 1.7 wide leave it at
t = 0.3, 0.52 and 0.74, to the left, right and left, with lengths 6.6, 5.6 and 4, shaped as
above.

The icon is used for the browser tab, the playground's window and MyGo apps. It's the plume
in the dark theme's accent, `#ee8494`, scaled to 0.74 around the center and set 0.5 lower,
on a superellipse of exponent 5 filled with the dark page's `#0c1618`, as MyGo and Apple
round an icon's corners. A rim of `#2a4247`, 2 wide, inside its edge keeps its shape on dark
backgrounds. The favicon is the icon with the 16-pixel cut, scaled to 0.8 around the center,
with a rim 1 wide.

`gen/mark.go` draws the SVGs from these numbers.

### Type

The name and the site are set in Hanken Grotesk. The name is in weight 650 with a letter
spacing of −0.025em, with the plume as tall as the l and a fifth of an em before it. Code is
set in the system's monospaced font.

The font is preloaded and declared with `font-display: optional` instead of fontsource's
`swap`, so a page is drawn once in it rather than first in the fallback font. `_headers`
lets browsers keep the files under `/_astro`, which are named by their content, for a year.
