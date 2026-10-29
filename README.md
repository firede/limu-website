# limu's website

The website at [limu.firede.com](https://limu.firede.com), for limu-rs in Rust and limu in
Go, built with Astro and served by Cloudflare as a Worker of static assets.
[docs/website.md](docs/website.md) says what it holds and how it looks, and
[AGENTS.md](AGENTS.md) has the rules for changing it.

It needs Node 22.13 or later, pnpm, Go, and Rust with its `wasm32-unknown-unknown` target.

```sh
pnpm install
pnpm playground  # builds both playgrounds for browsers, which dev and build need
pnpm dev         # writes what gen writes, then serves the site at localhost:4321
pnpm build       # the same, then builds the site into dist
pnpm check       # checks the site's types
pnpm run deploy  # builds the playgrounds and the site, and deploys them with wrangler
```

A push to main deploys the site, through `.github/workflows/site.yml`. The site shows
releases. `go.mod` requires the releases of limu and limumygo it shows, and
`limu-rs.json` names the tag of limu-rs it shows.
`.github/workflows/releases.yml` fails each day that a release is left behind.

To follow a new release of limu, run
`go get github.com/firede/limu@<version> && go get -tool github.com/firede/limu/limumygo/examples/playground@<version>`,
then `go mod tidy`. To follow a new release of limu-rs, set `ref` in `limu-rs.json` to its
tag, and run `pnpm playground:rust`. Then check the documents against what changed, and
push.

## What is written, and from what

`gen`, a Go program, writes what the site shows of limu's own work before Astro builds it.

- `public/mark.svg`, `mark-16.svg`, `icon.svg` and `icon-16.svg` are the mark and the icon,
  from the numbers in `gen/mark.go`, which docs/website.md describes.
- `src/generated/limu-theme.css` has `style.Kohu` and `style.KohuDark` as the `--limu-*`
  variables, for the site's light and dark themes. It also has Kohu, KohuDark and Default
  under `[data-diagram-theme]`, for the examples' switch.
- `src/generated/examples.json` has every example of limu's gallery, `internal/gallery`,
  drawn as SVG at the three widths the pages show, 640, 480 and 320.
- `src/generated/home.json` and `docs-diagrams.json` hold the pictures of the home page and
  of the documents, drawn the same way.
- `src/generated/mermaid-keywords.json` is limumygo's list of Mermaid's keywords, which the
  site's highlighter reads.

`scripts/playground.mjs` compiles the Go playground, limumygo's `examples/playground` at
the release `go.mod` requires, to WebAssembly. It writes the module and `wasm_exec.js`, Go's
loader of it, to `public/assets/playground/go`, named by their content, which
`public/_headers` has browsers keep for good. Their names and the module's size go to
`src/generated/playground.json`, which `src/pages/playground.astro` reads. It fails when
the module passes 24 MiB, as Cloudflare serves an asset of at most 25 MiB.

`scripts/playground-rust.mjs` builds the Rust playground from the commit or tag
`limu-rs.json` names, with limu-rs's own `scripts/playground.sh`. It writes the module and
`limu.js`, the script that calls it, to `public/assets/playground/rust`, named by their
content, and their names to `src/generated/playground-rust.json`, which
`src/pages/playground/rust.astro` reads. With `LIMU_RS` set to a checkout of limu-rs, it
builds that checkout as it is.

`pnpm playground` runs both. Run it again when a playground's release changes. `pnpm build`
does not, so that a change to the documents does not compile them again.

`src/generated` and `public/assets` are not committed. The rest of `public` is.
`public/icon-180.png` and `public/favicon.ico` are drawn from the SVGs by headless Chrome, as
Go's standard library has no rasterizer. Run `node scripts/icons.mjs` after the mark
changes.

## From Pele's website

The site's layout, its navigation, its code blocks and their highlighting, and the Markdown
each page is also served as, are adapted from [Pele's website](https://github.com/obsidianmd/pele/tree/main/website),
under the MIT license that [PELE-LICENSE](PELE-LICENSE) holds. limu changed its colors, its
type, its pages, and added highlighting for Rust and Go and a light theme.
