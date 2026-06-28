# Changelog

## [Unreleased]

### Refactor

- 迁移 usePinchZoom 到 Vue，删除 useSmoothZoom；从公开导出中移除内部实现

## [1.0.2] - 2026-06-26

### Fix

- SquareParser fallback to first child attrs for non-Rect shapes

## [1.0.1]

### Feat

- demo headless mode, annotator tabs first

### Fix

- annotator demo
- use statusText for status reply content
- replace CSS var cursor with inline SVG data URIs

### Docs

- rewrite README — concise, bilingual, aligned structure

### Chore

- bump version to 1.0.1
- rebuild demo
- update demo and build artifacts

## [1.0.0]

### Refactor

- migrate radix-vue to reka-ui, use shadcn-vue Input/Textarea, global theme vars

### Fix

- ?url worker import, bundle pdfjs CSS, i18n self-contained via useT
- demo样式、i18n、Portal定位、构建配置等多项修复
- 修复 dark 模式下签名/盖章组件和弹窗文字不可见问题

### Chore

- bump version to 1.0.0
- swap default README to zh-CN, rename English to README-en-US.md
- add github pages demo build to docs/
- remove peer deps section, all deps auto-install
- fix demo url in readme
