# CI 优化

## CI 优化

当流水线超过 10 分钟时，按影响顺序应用这些策略：

```
CI 流水线慢？
├── 缓存依赖
│   └── 使用 actions/cache 或 setup-node 缓存选项用于 node_modules
├── 并行运行作业
│   └── 将 lint、类型检查、测试、构建拆分为单独的并行作业
├── 只运行更改的内容
│   └── 使用路径过滤器跳过不相关的作业（例如，仅文档 PR 跳过 e2e）
├── 使用矩阵构建
│   └── 跨多个运行器分片测试套件
├── 优化测试套件
│   └── 从关键路径移除慢测试，改为按计划运行
└── 使用更大的运行器
    └── GitHub 托管的更大运行器或 CPU 密集型构建的自托管
```

## 示例：缓存和并行

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm test -- --coverage
```
