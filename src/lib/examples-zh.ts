import type { ExampleType } from './examples';
import type { Locale } from './i18n';

// The types of limu's gallery in Chinese, by the type's name. The examples' own titles and
// their diagrams stay in English, as the gallery writes them. A type the gallery adds needs
// its name here, or the build fails.
const types: Record<string, [title: string, description: string]> = {
  block: ['块图', '按列手动摆放在网格上的块，用箭头相连。'],
  c4: ['C4', '在 C4 模型的某一层上，一个软件系统的上下文、容器或组件。'],
  class: ['类图', '类及其字段和方法，以及它们之间的继承和使用关系。'],
  er: ['实体关系图', '数据模型中的实体、它们的属性，以及实体之间的数量对应关系。'],
  eventmodeling: ['事件建模', '把系统随时间的变化排成一行界面、命令、事件和视图。'],
  flowchart: ['流程图', '用方框表示流程的步骤，用箭头表示每一步通向哪里。'],
  gantt: ['甘特图', '把项目的任务画成沿日历排列的条形，标出日期和依赖。'],
  gitGraph: ['Git 图', '仓库各分支上的提交，以及分支在哪里分叉、在哪里合并。'],
  kanban: ['看板', '按列排列卡片的看板，每列对应工作的一个阶段。'],
  mindmap: ['思维导图', '一个中心主题，从中分出若干话题，话题下再分出子话题。'],
  packet: ['数据包图', '数据包或报头的各个字段，宽度与所占位数一致。'],
  pie: ['饼图', '把整体分成若干扇区，扇区大小与占比一致。'],
  quadrantChart: ['象限图', '在分成四个象限的正方形里，按两条坐标轴放置的点。'],
  requirement: ['需求图', '需求、满足或验证需求的元素，以及它们之间的依赖。'],
  sankey: ['桑基图', '在节点之间流动的数量，每条流带的宽度与流量一致。'],
  sequence: ['时序图', '并排的参与者，以及它们按发送顺序互相发送的消息。'],
  state: ['状态图', '系统可能处于的状态，以及让它从一个状态转到另一个状态的事件。'],
  timeline: ['时间线', '沿一条线按顺序排列、按时期分组的事件。'],
  journey: ['用户旅程', '用户完成一项任务的各个步骤，按每一步的感受打分。'],
  xychart: ['XY 图', '画在横轴和纵轴上的柱形和折线。'],
  agentflow: ['Agent 流程图', 'AI agent 的任务、工具和决策，以及它们如何互相交接工作。'],
  architecture: ['架构图', '按运行位置分组的服务和资源，以及它们之间的连接。'],
  cynefin: ['Cynefin', '按 Cynefin 框架的各个域归类的情境，从清晰到混乱。'],
  ishikawa: ['石川图', '一个问题的原因，按类别排在鱼骨上。'],
  radar: ['雷达图', '画在从同一中心向外辐射的坐标轴上的几组数值。'],
  railroad: ['铁路图', '把语法规则画成轨道，合法的输入从起点沿轨道走到终点。'],
  swimlane: ['泳道图', '按泳道排布的流程，每条泳道对应执行步骤的一个人或团队。'],
  treeView: ['树视图', '按树形缩进的层级结构，如项目的文件夹和文件。'],
  treemap: ['矩形树图', '用嵌套矩形表示的层级数值，每个矩形的大小与数值一致。'],
  usecase: ['用例图', '系统之外的参与者，以及他们参与的用例。'],
  venn: ['韦恩图', '用相互重叠的圆表示集合，重叠处是它们的共同部分。'],
  wardley: ['Wardley 地图', '价值链的各个组件，按可见程度和演进程度放置。'],
};

const zh = (t: ExampleType) => {
  const entry = types[t.type];
  if (!entry) throw new Error(`src/lib/examples-zh.ts has no Chinese name for the examples of ${t.type}`);
  return entry;
};

export const typeTitle = (locale: Locale, t: ExampleType): string => (locale === 'zh' ? zh(t)[0] : t.title);
export const typeDescription = (locale: Locale, t: ExampleType): string => (locale === 'zh' ? zh(t)[1] : t.description);
