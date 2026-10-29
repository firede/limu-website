#!/bin/sh
# Checks that the site follows the latest releases of limu and limumygo, which go.mod
# requires, and of limu-rs, whose tag limu-rs.json names, and fails, naming each release it
# doesn't follow, when it doesn't.
set -eu
cd "$(dirname "$0")/.."
behind=$(go list -m -u -f '{{if .Update}}{{.Path}} {{.Version}}, released {{.Update.Version}}{{end}}' \
	github.com/firede/limu github.com/firede/limu/limumygo)

repository=$(sed -n 's/.*"repository": *"\([^"]*\)".*/\1/p' limu-rs.json)
ref=$(sed -n 's/.*"ref": *"\([^"]*\)".*/\1/p' limu-rs.json)
latest=$(git ls-remote --tags --refs "$repository" 'v*' | sed 's|.*refs/tags/||' |
	grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n 1)
if [ -n "$latest" ] && [ "$ref" != "$latest" ]; then
	behind="${behind:+$behind
}$repository $ref, released $latest"
fi

if [ -n "$behind" ]; then
	echo "The site doesn't follow the latest release of:"
	echo "$behind"
	echo "README.md says how to follow it."
	exit 1
fi
echo "The site follows the latest releases."
