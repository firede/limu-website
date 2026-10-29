# Working on limu's website

This repository is limu's website, [limu.firede.com](https://limu.firede.com). Read
docs/website.md first. It says what the site holds, how it looks, and how it's built.

## Rules

- The site shows releases of limu, never a branch. `go.mod` requires the releases `gen` and
  the playground are built from. Don't add a `replace` to it. A `go.work`, which git ignores,
  is how the site is built with an unreleased limu on one's own machine.
- When limu or limumygo is released, follow the release: require it in `go.mod` as
  README.md says, read what changed since the release before it, and change the documents
  that describe what changed. `./scripts/releases.sh` says whether the site follows the
  latest releases, and fails each day in CI while it doesn't.
- `go test ./gen`, `pnpm check` and `pnpm build` pass before a change is done, after
  `pnpm playground` when the playground's release changed.
- What the site says of limu agrees with limu's own documents, its README and
  docs/design.md. Where they disagree, find out which is right before writing either.
- A change to how the site looks or what it holds changes docs/website.md too.

## Writing

Comments and documents are plain and exact. Say what a thing does and why, in full
sentences, without selling it. In documents, write short, natural sentences, and avoid
semicolons and lists led by a colon in running prose. Commit messages say what changed, in
the imperative.
