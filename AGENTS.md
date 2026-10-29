# Working on limu's website

This repository is the website of limu and limu-rs, [limu.firede.com](https://limu.firede.com).
Read docs/website.md first. It says what the site holds, how it looks, and how it's built.

## Rules

- The site shows releases of limu and limu-rs, never a branch. `go.mod` requires the
  releases of limu that `gen` and the Go playground are built from. Don't add a `replace` to
  it. A `go.work`, which git ignores, is how the site is built with an unreleased limu on
  one's own machine. `limu-rs.json` names the tag of limu-rs the Rust playground is built
  from, and names a commit only until limu-rs's first release. `LIMU_RS` builds the Rust
  playground from a local checkout instead.
- When limu, limumygo or limu-rs is released, follow the release as README.md says. Read
  what changed since the release before it, and change the documents that describe what
  changed. `./scripts/releases.sh` says whether the site follows the latest releases, and
  fails each day in CI while it doesn't.
- The documents are shared by both languages. A name or an example that differs between
  them is written for each, as docs/website.md describes, and every Rust example compiles
  against the limu-rs the site follows.
- `go test ./gen`, `pnpm check` and `pnpm build` pass before a change is done, after
  `pnpm playground` when a playground's release changed.
- What the site says of limu agrees with limu's own documents, its README and
  docs/design.md, and what it says of limu-rs agrees with limu-rs's. Where they disagree,
  find out which is right before writing either.
- A change to how the site looks or what it holds changes docs/website.md too.

## Writing

Comments and documents are plain and exact. Say what a thing does and why, in full
sentences, without selling it. In documents, write short, natural sentences, and avoid
semicolons and lists led by a colon in running prose. Commit messages say what changed, in
the imperative.
