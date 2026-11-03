package main

import "log"

// The home page's picture of where the pipeline branches, drawn by limu: a renderer of SVG
// goes from text to a layout to SVG, for a browser; limu goes from text to a layout to a
// scene, and branches there, to a backend. The page marks the scene in its accent. The Chinese
// home page draws the same in Chinese.
const (
	rendererSource = `flowchart LR
  text[Mermaid text] --> layout[Layout] --> svg[SVG] --> browser[Browser]`
	limuSource = `flowchart LR
  text[Mermaid text] --> layout[Layout] --> scene[Scene]
  scene --> svg[SVG]
  scene --> gpu[GPUI or MyGo, on the GPU]
  scene --> bitmap[tiny-skia or Core Graphics]
  scene --> own[A backend of your own]`
	rendererSourceZh = `flowchart LR
  text[Mermaid 文本] --> layout[布局] --> svg[SVG] --> browser[浏览器]`
	limuSourceZh = `flowchart LR
  text[Mermaid 文本] --> layout[布局] --> scene[场景]
  scene --> svg[SVG]
  scene --> gpu[GPUI 或 MyGo，在 GPU 上]
  scene --> bitmap[tiny-skia 或 Core Graphics]
  scene --> own[你自己的后端]`
)

type homeDrawings struct {
	Renderer   drawing `json:"renderer"`
	Limu       drawing `json:"limu"`
	RendererZh drawing `json:"rendererZh"`
	LimuZh     drawing `json:"limuZh"`
}

func home() homeDrawings {
	var d [4]drawing
	for i, src := range []string{rendererSource, limuSource, rendererSourceZh, limuSourceZh} {
		var err error
		if d[i], err = draw(src); err != nil {
			log.Fatal(err)
		}
	}
	return homeDrawings{d[0], d[1], d[2], d[3]}
}
