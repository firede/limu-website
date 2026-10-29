package main

import (
	"bufio"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

// The playground's palettes are the site's colors, as src/styles/base.scss has them: the
// light theme in the first :root that sets color-scheme, the dark one in its mixin. The
// playground keeps them in limumygo's examples/playground/appearance.go, as the variables
// kohu and kohuDark, each field named as the CSS variable it holds in camel case. This reads
// them from the release go.mod requires, so a release whose playground drifts from the site
// fails here.
func TestPalettes(t *testing.T) {
	css := siteColors(t)
	palettes := playgroundPalettes(t)
	for block, name := range map[string]string{"light": "kohu", "dark": "kohuDark"} {
		p, ok := palettes[name]
		if !ok {
			t.Fatalf("appearance.go has no palette %s", name)
		}
		if len(p) == 0 {
			t.Fatalf("palette %s has no colors", name)
		}
		for field, hex := range p {
			v := kebab(field)
			if field == "selection" {
				v = "selection-background"
			}
			got, ok := css[block][v]
			if !ok {
				t.Errorf("%s: base.scss has no --%s", block, v)
				continue
			}
			if c, ok := cssRGBA(got); ok {
				got = c
			}
			if got != hex {
				t.Errorf("%s: --%s is %s, the playground's %s", block, v, got, hex)
			}
		}
	}
}

// siteColors are the variables of base.scss's light and dark themes, by their names.
func siteColors(t *testing.T) map[string]map[string]string {
	f, err := os.Open("../src/styles/base.scss")
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	vars := map[string]map[string]string{}
	block := ""
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		switch {
		case line == "color-scheme: light;":
			block = "light"
		case line == "@mixin dark {":
			block = "dark"
		case line == "}":
			block = ""
		case block != "" && strings.HasPrefix(line, "--"):
			name, value, _ := strings.Cut(strings.TrimSuffix(line, ";"), ": ")
			if vars[block] == nil {
				vars[block] = map[string]string{}
			}
			vars[block][name[2:]] = value
		}
	}
	if err := sc.Err(); err != nil {
		t.Fatal(err)
	}
	return vars
}

// playgroundPalettes are the colors of the palettes appearance.go declares, by the names of
// the variables and of their fields. Fields that aren't strings, as dark and diagram, are
// left out.
func playgroundPalettes(t *testing.T) map[string]map[string]string {
	dir, err := exec.Command("go", "list", "-m", "-f", "{{.Dir}}", "github.com/firede/limu/limumygo").Output()
	if err != nil {
		t.Fatalf("finding limumygo: %v", err)
	}
	file := filepath.Join(strings.TrimSpace(string(dir)), "examples", "playground", "appearance.go")
	f, err := parser.ParseFile(token.NewFileSet(), file, nil, 0)
	if err != nil {
		t.Fatal(err)
	}
	out := map[string]map[string]string{}
	ast.Inspect(f, func(n ast.Node) bool {
		spec, ok := n.(*ast.ValueSpec)
		if !ok || len(spec.Names) != 1 || len(spec.Values) != 1 {
			return true
		}
		lit, ok := spec.Values[0].(*ast.CompositeLit)
		if !ok {
			return true
		}
		if id, ok := lit.Type.(*ast.Ident); !ok || id.Name != "palette" {
			return true
		}
		p := map[string]string{}
		for _, e := range lit.Elts {
			kv, ok := e.(*ast.KeyValueExpr)
			if !ok {
				continue
			}
			key, ok := kv.Key.(*ast.Ident)
			s, isString := kv.Value.(*ast.BasicLit)
			if !ok || !isString || s.Kind != token.STRING {
				continue
			}
			v, err := strconv.Unquote(s.Value)
			if err != nil {
				t.Fatal(err)
			}
			p[key.Name] = v
		}
		out[spec.Names[0].Name] = p
		return false
	})
	return out
}

// kebab is a name in camel case written as CSS writes it, as lineHover is line-hover.
func kebab(s string) string {
	var b strings.Builder
	for _, r := range s {
		if r >= 'A' && r <= 'Z' {
			b.WriteByte('-')
			r += 'a' - 'A'
		}
		b.WriteRune(r)
	}
	return b.String()
}

// cssRGBA is a color written as rgb(r g b / a%) in hex, with its alpha, as the palettes
// write translucent colors.
func cssRGBA(s string) (string, bool) {
	var r, g, b, a int
	if _, err := fmt.Sscanf(s, "rgb(%d %d %d / %d%%)", &r, &g, &b, &a); err != nil {
		return "", false
	}
	return fmt.Sprintf("#%02x%02x%02x%02x", r, g, b, int(math.Round(float64(a)*255/100))), true
}
