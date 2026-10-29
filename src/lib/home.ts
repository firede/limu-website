import type { languageTitles } from './site';

interface Install {
  language: keyof typeof languageTitles;
  id: string;
  title: string;
  command: string;
  note: string;
  code: string;
}

// The code the home page shows for each language, Rust's first, in the order it shows it:
// drawing natively first, as that is what limu is for, then SVG.
export const installs: Install[] = [
  {
    language: 'rust',
    id: 'gpui',
    title: 'GPUI',
    command: 'cargo add limu limu-gpui',
    note: 'limu-gpui paints a scene in a GPUI window, on the GPU with the rest of the window, and measures its text with GPUI’s text system. The scene tells you which part is under the pointer.',
    code: `// Measure text with the window's text system.
let measurer = TextMeasurer::new(window, Fonts::default());
let layout = limu::layout::Options {
    measurer: &measurer,
    ..Default::default()
};
let scene = limu::layout(src, &layout)?;

// In a canvas's paint closure, paint the scene, and find the part at a point.
let o = Options {
    look: Look::new(Theme::KOHU_DARK),
    ..Options::default()
};
paint(&scene, &o, bounds.origin, 1.0, window, cx);
if let Some(i) = scene.item_at(at, 4.0) {
    let it = &scene.items[i];
    println!("clicked {} {:?}", it.role.as_str(), it.id);
}`,
  },
  {
    language: 'rust',
    id: 'tiny-skia',
    title: 'tiny-skia',
    command: 'cargo add limu limu-tiny-skia',
    note: 'limu-tiny-skia draws a scene into a bitmap, in font files your program carries, with no GPU and no system libraries. Lay out the diagram with the same fonts you draw it in.',
    code: `let fonts = Fonts::new(std::fs::read("Inter-Regular.ttf")?)?;
let layout = limu::layout::Options {
    measurer: &fonts,
    ..Default::default()
};
let scene = limu::layout(src, &layout)?;
let o = Options {
    look: Look::new(Theme::KOHU),
    fonts: Some(&fonts),
    scale: 2.0,
    ..Options::default()
};
let pixmap = limu_tiny_skia::render(&scene, &o).ok_or("too large to draw")?;
pixmap.save_png("diagram.png")?;`,
  },
  {
    language: 'rust',
    id: 'terminal',
    title: 'Terminal',
    command: 'cargo add limu limu-ascii',
    note: 'limu-ascii lays a diagram out in a terminal’s cells and draws it in box-drawing characters, or in ASCII alone.',
    code: `let cells = Cells::default();
let layout = limu::layout::Options {
    measurer: &cells,
    font_size: cells.font_size(),
    snap: Some(cells.grid()),
    max_width: 80.0 * cells.width,
    direction_breakpoint: f64::INFINITY,
    ..Default::default()
};
let scene = limu::layout(src, &layout)?;
print!("{}", limu_ascii::render(&scene, &Options::default())?);`,
  },
  {
    language: 'rust',
    id: 'rust-svg',
    title: 'SVG',
    command: 'cargo add limu',
    note: 'limu::scene::svg writes a scene as SVG and leaves its colors as CSS variables, so a page can restyle it. limu uses only Rust’s standard library.',
    code: `let scene = limu::layout(src, &Default::default())?;
let out = svg::render(&scene, &svg::Options {
    look: Look::new(Theme::KOHU),
    ..Default::default()
});`,
  },
  {
    language: 'go',
    id: 'mygo',
    title: 'MyGo',
    command: 'go get github.com/firede/limu/limumygo',
    note: 'limumygo draws a scene on the GPU with MyGo’s native UI and tells you which part is under the pointer. Lay out the diagram with the same fonts you draw it in.',
    code: `fonts := limumygo.DefaultFonts
sc, err := limu.Layout(src, &layout.Options{Measurer: fonts})
if err != nil {
	return err
}

// Draw the diagram in a view, and see which part was clicked.
w := limumygo.View(c, sc, &limumygo.Options{
	Look:  style.Look{Theme: style.KohuDark()},
	Fonts: fonts,
})
if it := w.Clicked(); it != nil {
	fmt.Println("clicked", it.Role, it.ID)
}`,
  },
  {
    language: 'go',
    id: 'go-svg',
    title: 'SVG',
    command: 'go get github.com/firede/limu',
    note: 'The svg package writes a scene as SVG and leaves its colors as CSS variables, so a page can restyle it. limu and the svg package use only Go’s standard library.',
    code: `sc, err := limu.Layout(src, nil)
if err != nil {
	return err
}
out := svg.Render(sc, &svg.Options{Look: style.Look{Theme: style.Kohu()}})`,
  },
];
