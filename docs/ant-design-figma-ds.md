# Ant Design × Figma 企业级设计系统（本机文档）

已在当前 Figma 文档中创建：**变量集合 `Ant Design / Theme`（modes：`light`、`dark`）**、**文本样式 `Typography/...`**、**效果样式 `shadow/...`**、**Button 组件集**、**Input 组件**及 **Foundations 可视化页面**。

## 变量命名（与 Ant Design 5 语义对齐）

### 颜色（COLOR）

`colorPrimary` `colorSuccess` `colorWarning` `colorError` `colorInfo`  
`colorText` `colorTextSecondary` `colorTextTertiary` `colorTextQuaternary` `colorTextLightSolid`  
`colorBgBase` `colorBgContainer` `colorBgElevated` `colorBgLayout` `colorBgSpotlight` `colorBgMask`  
`colorBorder` `colorBorderSecondary`  
`colorFill` `colorFillSecondary` `colorFillTertiary` `colorFillQuaternary`  
`colorSplit` `colorWhite`

### 间距与尺寸（FLOAT，4px 基准）

`sizeUnit` `sizeStep`  
`marginXXS` `marginXS` `marginSM` `margin` `marginMD` `marginLG` `marginXL` `marginXXL`  
`paddingXXS` `paddingXS` `paddingSM` `padding` `paddingMD` `paddingLG` `paddingXL`  
`borderRadiusXS` `borderRadiusSM` `borderRadius` `borderRadiusLG`  
`controlHeightXS` `controlHeightSM` `controlHeight` `controlHeightLG`  
`fontSizeSM` `fontSize` `fontSizeLG` `fontSizeXL`  
`fontSizeHeading1` … `fontSizeHeading5`  
`lineHeightSM` `lineHeight` `lineHeightLG` `lineHeightHeading1`

### 字体栈（STRING）

`fontFamily` — 需在 Figma「变量」面板中为 light/dark 填入同一字符串（例如 Ant Design 推荐系统字体栈）。

## 文本样式

- `Typography/Heading/h1` … `h5`
- `Typography/Body/text` `textSM` `textLG`

## 阴影样式

- `shadow/boxShadow`
- `shadow/boxShadowSecondary`
- `shadow/boxShadowTertiary`

## 组件

- **Button** 组件集：类型含 `primary` `default` `dashed` `text` `link` + `danger`，状态含 `default` `disabled`。若属性名显示为 `Property 1` / `Property 2`，可在 Figma 中重命名为 `Type` / `State`。
- **Input / outlined / default**：单行占位示意，已发布为组件。

## 页面结构

1. `🎯 设计系统 · 封面`
2. `📐 Foundations · 设计令牌` — 色板、排版阶梯、4px 间距条
3. `🧩 Components · 组件库` — Button、Input 等

## 后续可扩展（未在此会话中全部搭建）

表格、表单、分页、弹层、导航、树、日期等 Ant Design 全套组件建议在现有变量与 Button/Input 模式上继续复制结构，并保持 **Auto Layout + 变量绑定 + 组件属性** 一致。
