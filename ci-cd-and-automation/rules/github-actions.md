# GitHub Actions 配置

## 基本 CI 流水线

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: 类型检查
        run: npx tsc --noEmit

      - name: 测试
        run: npm test -- --coverage

      - name: 构建
        run: npm run build

      - name: 安全审计
        run: npm audit --audit-level=high
```

## 带数据库集成测试

```yaml
  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: ci_user
          POSTGRES_PASSWORD: ${{ secrets.CI_DB_PASSWORD }}
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - name: 运行迁移
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://ci_user:${{ secrets.CI_DB_PASSWORD }}@localhost:5432/testdb
      - name: 集成测试
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://ci_user:${{ secrets.CI_DB_PASSWORD }}@localhost:5432/testdb
```

> **注意：** 即使对于仅 CI 的测试数据库，也使用 GitHub Secrets 存储凭据，而不是硬编码值。这建立了良好的习惯，并防止在其他上下文中意外重用测试凭据。

## E2E 测试

```yaml
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - name: 安装 Playwright
        run: npx playwright install --with-deps chromium
      - name: 构建
        run: npm run build
      - name: 运行 E2E 测试
        run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 将 CI 失败反馈给 Agent

CI 与 AI agent 结合的力量是反馈循环。当 CI 失败时：

```
CI 失败
    │
    ▼
复制失败输出
    │
    ▼
反馈给 agent：
"CI 流水线因以下错误失败：
[粘贴具体错误]
修复问题并在再次推送前本地验证。"
    │
    ▼
Agent 修复 → 推送 → CI 再次运行
```

**关键模式：**

```
Lint 失败 → Agent 运行 `npm run lint --fix` 并提交
类型错误 → Agent 读取错误位置并修复类型
测试失败 → Agent 遵循调试与错误恢复技能
构建错误 → Agent 检查配置和依赖
```
