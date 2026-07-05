# 部署策略

## 预览部署

每个 PR 都获得预览部署用于手动测试：

```yaml
# 在 PR 上部署预览（Vercel/Netlify/等）
deploy-preview:
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v4
    - name: 部署预览
      run: npx vercel --token=${{ secrets.VERCEL_TOKEN }}
```

## 特性标志

特性标志将部署与发布解耦。在标志后部署未完成或有风险的功能，这样你可以：

- **发布代码而不启用它。** 尽早合并到 main，准备就绪时启用。
- **无需重新部署即可回滚。** 禁用标志而不是回滚代码。
- **金丝雀新功能。** 为 1% 的用户启用，然后 10%，然后 100%。
- **运行 A/B 测试。** 比较有和没有功能的行为。

```typescript
// 简单的特性标志模式
if (featureFlags.isEnabled('new-checkout-flow', { userId })) {
  return renderNewCheckout();
}
return renderLegacyCheckout();
```

**标志生命周期：** 创建 → 为测试启用 → 金丝雀 → 全面推出 → 移除标志和死代码。永远存在的标志会成为技术债务——创建时设置清理日期。

## 分阶段推出

```
PR 合并到 main
    │
    ▼
  Staging 部署（自动）
    │ 手动验证
    ▼
  生产部署（手动触发或 staging 后自动）
    │
    ▼
  监控错误（15 分钟窗口）
    │
    ├── 检测到错误 → 回滚
    └── 干净 → 完成
```

## 回滚计划

每次部署在发生之前都需要回滚计划：

```yaml
# 手动回滚工作流
name: 回滚
on:
  workflow_dispatch:
    inputs:
      version:
        description: '要回滚到的版本'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: 回滚部署
        run: |
          # 部署指定的先前版本
          npx vercel rollback ${{ inputs.version }}
```
