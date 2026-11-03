---
title: "MyGo"
description: "用 limumygo 原生绘制图表，并找出指针下方的部分。"
---

limumygo 包用 [MyGo](https://mygo.egoist.dev) 的原生 UI 在 GPU 上绘制 limu 的场景，并告诉你指针下方是图表的哪个部分。图表画在应用自己的窗口中，使用应用的字体。

## 安装 {#installing}

limumygo 是一个独立的模块，这样 limu 的其他包就只依赖 Go 标准库。

```shell
go get github.com/firede/limu/limumygo
```

你还需要 MyGo 构建应用所需的一切。参见 [MyGo 的文档](https://mygo.egoist.dev)。

## 显示图表 {#showing-a-diagram}

`limumygo.View` 创建一个与场景同样大小的元素，并在其中绘制场景。布局时要用绘制时的同一套字体，原因见[字体](#fonts)。

```go
package main

import (
	"log"

	"github.com/egoist/mygo"
	"github.com/egoist/mygo/ui"
	"github.com/firede/limu"
	"github.com/firede/limu/layout"
	"github.com/firede/limu/limumygo"
	"github.com/firede/limu/scene"
	"github.com/firede/limu/style"
)

type app struct {
	sc      *scene.Scene
	clicked string
}

func (a *app) view(c *ui.Context) {
	theme := style.Kohu()
	if c.Theme().Dark {
		theme = style.KohuDark()
	}
	ui.Column(c).Padding(16).Gap(12).Children(func() {
		w := limumygo.View(c, a.sc, &limumygo.Options{
			Look:  style.Look{Theme: theme},
			Fonts: limumygo.DefaultFonts,
		})
		if it := w.Clicked(); it != nil {
			a.clicked = string(it.Role) + " " + it.ID
		}
		ui.Text(c, "Clicked: "+a.clicked)
	})
}

func main() {
	sc, err := limu.Layout(`flowchart LR
  text[Mermaid text] --> layout[Layout] --> scene[Scene]`,
		&layout.Options{Measurer: limumygo.DefaultFonts})
	if err != nil {
		log.Fatal(err)
	}
	a := &app{sc: sc}
	mygo.App.WhenReady(func() {
		mygo.NewWindow(mygo.WindowOptions{Title: "Diagram", Width: 640, Height: 360, Content: ui.View(a.view)})
	})
	if err := mygo.App.Run(); err != nil {
		log.Fatal(err)
	}
}
```

主题变化时，比如系统切换到深色模式，只需重绘场景。

这个控件会显示指针下方图元的提示文字，指针移到带链接的图元上时会变成手形。`Hovered` 返回指针下方的图元，`Clicked` 返回自上一帧以来被点击的图元。没有图元时两者都返回 nil。`Element` 返回控件的元素，方便你摆放它或给它加背景。辅助技术会把图表读作一张图片，名称取自场景的标题，`Label` 可以设置别的名称。

要让图表适应元素，从 `LayoutBounds` 读取元素的宽度，它保存的是上一帧的尺寸。宽度变化时，用新的 `MaxWidth` 重新布局。用 `limu.Parse` 解析一次文本，大图表放到另一个 goroutine 中布局，[Playground](/playground) 就是这样做的。

### 找出指针下方的图元 {#finding-the-item-under-the-pointer}

`limumygo.ItemAt` 按场景坐标找出某一点上的图元，不需要控件。多个图元重叠时，它返回最后绘制的那个，也就是最上面的那个。点落在图元的方框或其标签的方框内，就算命中。对于边和只由线条构成的图元，点与线条的距离在容差以内，或落在它们的某个标记内，就算命中。控件使用的容差是 `limumygo.Slop`，即 4 DIP（MyGo 的设备无关像素）。

```go
if it := limumygo.ItemAt(sc, scene.Point{X: x, Y: y}, limumygo.Slop); it != nil {
	fmt.Println(it.Role, it.ID)
}
```

## 绘制 {#painting}

`limumygo.Paint` 在 `ui.Painter` 上绘制场景，左上角位于给定的点，单位是 DIP。用它可以在你自己的元素中绘制图表。

```go
o := &limumygo.Options{Look: look, Fonts: fonts, Scale: 2}
ui.Box(c).Size(float32(sc.Width*2), float32(sc.Height*2)).Draw(func(p *ui.Painter, r ui.Rect) {
	limumygo.Paint(p, sc, r.X, r.Y, o)
})
```

`Options.Scale` 设置场景的一个单位占多少 DIP。要缩放或平移，改变缩放比例和绘制的起点。不要在 `ui.Painter.Transform` 下或变换过的元素中绘制。MyGo 按 painter 的缩放比例生成遮罩来绘制每条路径，变换会拉伸遮罩，所以这样缩放的图表会变模糊。非常大的路径还可能在分块的接缝处显出细线。

limumygo 画出的图与 svg 包写出的相同，只有几处差别。

- MyGo 无法按不透明度绘制分组，所以 limumygo 把图元的不透明度乘到它的每种颜色上。图元的各部分重叠时，下面的部分会透出来。
- 圆角半径对方框来说太大时，limumygo 取宽度一半和高度一半中较小的那个，而 SVG 用的是椭圆形圆角。

## 字体 {#fonts}

图表用测量器布局，用字体绘制。两者不一致时，文本会放不进布局为它留的空间。`limumygo.Fonts` 同时承担这两项工作。它是一个 `text.Measurer`，用 painter 绘制所用的同一套字体测量，由系统的文本引擎塑形，与 MyGo 处理其他文本的方式相同。

```go
fonts := limumygo.NewFonts("Inter, system-ui", "JetBrains Mono, monospace")
sc, err := limu.Layout(src, &layout.Options{Measurer: fonts})
w := limumygo.View(c, sc, &limumygo.Options{Look: look, Fonts: fonts})
```

`limumygo.DefaultFonts` 使用系统字体及其等宽字体。字体族是一个按顺序尝试的字体列表，格式与 `ui.Font` 接收的相同。粗体和斜体文本使用字体族的粗体字重和斜体，等宽文本使用等宽字体族。`Fonts` 会缓存最近塑形过的文本，所以先测量、再绘制同一个标签不会多花代价。它可以在多个 goroutine 中同时使用。

中文、日文和韩文按绘制时的字体测量，字体族未覆盖的文字会回退到系统字体。系统的文本引擎会在汉字与拉丁字母或数字相邻处加一点间距，`Fonts` 也会把这段间距算进去。

## 图标和图片 {#icons-and-images}

limumygo 从不自行加载图片或打开链接。你的应用知道图片从哪里来、哪些链接可以安全打开，由它来做这些决定。

`Options.DrawIcon` 按名称绘制图标，比如 `fa:fa-car`，颜色是图元的文本颜色。布局只为你通过 `layout.Options.Icons` 报告的图标留出空间，所以两处要给同一组图标。

```go
icons := map[string]*ui.SVG{"fa:fa-car": car}
sc, err := limu.Layout(src, &layout.Options{
	Measurer: fonts,
	Icons:    func(name string) bool { return icons[name] != nil },
})
o := &limumygo.Options{
	Look:  look,
	Fonts: fonts,
	DrawIcon: func(p *ui.Painter, name string, r ui.Rect, c ui.Color) {
		if s := icons[name]; s != nil {
			p.Icon(s, r, c)
		}
	},
}
```

`Options.DrawImage` 按 URL 把图片绘制到一个方框中。设置了 `fit` 时，图片保持比例并居中，否则拉伸以填满方框。布局只会传递 scheme 被 `layout.Options.ImageSchemes` 允许的 URL，图片的加载和缓存由你负责。没有 `DrawIcon` 或 `DrawImage` 时，图标和图片会被省略。

带链接的图元被点击时，它的 `Link` 字段保存着目标地址。按应用打开其他链接的方式打开它，或者不打开。

## 自定义绘制 {#custom-drawing}

`Options.Draw` 代替默认方式绘制每个图元，`next` 按默认方式绘制它。它收到的 `limumygo.Painter` 内嵌了 `ui.Painter`，并用 `Point`、`Rect`、`Len` 和 `Path` 把场景坐标换算成 DIP。它也可以用 `Item`、`Parts`、`Ends`、`Picture` 和 `Label` 绘制默认的各个部分。样式以 `style.Resolved` 传入，其中每种颜色都已经确定，因为 MyGo 用普通颜色绘制。

```go
o.Draw = func(p *limumygo.Painter, it *scene.Item, s style.Resolved, next func()) {
	if it.Kind != scene.Node {
		next()
		return
	}
	// 把节点画成我们自己的方框，标签按默认方式绘制。
	p.Fill(p.Rect(it.Box), limumygo.Color(s.Fill, s.Opacity), 8)
	p.Label(it, s)
}
```

[mygo-platinum](https://github.com/firede/mygo-platinum) 就用这种方式，以经典 Mac OS 的风格绘制图表。

## 编辑器高亮 {#editor-highlighting}

`limumygo/mermaid` 包让 Mermaid 成为 MyGo 代码编辑器中的一种语言。它知道每种图表类型的关键字，并根据声明类型的那一行确定类型。

```go
buf := editor.NewBuffer(src)
buf.SetLanguage(mermaid.Language)
```

它一次只读一行，不解析图表。要判断文本是否有效，请使用 limu 返回的错误。

## 在浏览器中 {#in-a-browser}

MyGo 应用也可以作为 WebAssembly 在浏览器中运行，limumygo 同样可以。[Playground](/playground) 就是这样运行的。如何构建和加载这样的应用，参见 MyGo 的文档。在浏览器中，文本由浏览器塑形，`Fonts` 也按浏览器排布文本的方式测量。limu 和 limumygo 会让未压缩的 WebAssembly 增大约 7 MB。
