# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.0.7](https://github.com/Laomai-codefee/inklayer-vue/compare/v1.0.6...v1.0.7) (2026-07-01)

### [1.0.6](https://github.com/Laomai-codefee/inklayer-vue/compare/v1.0.5...v1.0.6) (2026-07-01)

### [1.0.5](https://github.com/Laomai-codefee/inklayer-vue/compare/v1.0.4...v1.0.5) (2026-07-01)


### Features

* add inklayerVuePlugin, vite-plugin-dts, and unify build output naming ([c41d33a](https://github.com/Laomai-codefee/inklayer-vue/commit/c41d33a7f04c4ddfec0a76f5ce30587395ddc7cd))

### [1.0.4](https://github.com/Laomai-codefee/inklayer-vue/compare/v1.0.3...v1.0.4) (2026-06-29)


### Bug Fixes

* align PDF viewer container layout with pdfjs original, fix sidebar auto-scale and overflow clipping ([20bb104](https://github.com/Laomai-codefee/inklayer-vue/commit/20bb1044c8531c342ec26ee6399b67657bfefc2c))

### [1.0.3](https://github.com/Laomai-codefee/inklayer-vue/compare/v1.0.2...v1.0.3) (2026-06-28)

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
