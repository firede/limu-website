#!/bin/sh
# Checks that the site follows the latest releases of limu and limumygo, which go.mod
# requires, and fails, naming each release it doesn't follow, when it doesn't.
set -eu
cd "$(dirname "$0")/.."
behind=$(go list -m -u -f '{{if .Update}}{{.Path}} {{.Version}}, released {{.Update.Version}}{{end}}' \
	github.com/firede/limu github.com/firede/limu/limumygo)
if [ -n "$behind" ]; then
	echo "The site doesn't follow the latest release of:"
	echo "$behind"
	echo "README.md says how to follow it."
	exit 1
fi
echo "The site follows the latest releases."
