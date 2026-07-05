# 环境管理

## 环境管理

```
.env.example       → 已提交（开发人员模板）
.env                → 未提交（本地开发）
.env.test           → 已提交（测试环境，无真实机密）
CI 机密            → 存储在 GitHub Secrets / vault 中
生产机密           → 存储在部署平台 / vault 中
```

CI 永远不应有生产机密。为 CI 测试使用单独的机密。

## CI 之外的自动化

### Dependabot / Renovate

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
```

### 构建值班角色

指定某人负责保持 CI 绿色。当构建中断时，构建值班的工作是修复或回滚——而不是导致中断的人。这防止中断构建累积，而每个人都认为别人会修复它。

### PR 检查

- **必需审查：** 合并前至少 1 个批准
- **必需状态检查：** 合并前 CI 必须通过
- **分支保护：** 不允许强制推送到 main
- **自动合并：** 如果所有检查通过并批准，自动合并
