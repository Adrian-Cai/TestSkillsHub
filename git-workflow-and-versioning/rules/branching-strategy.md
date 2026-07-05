# 分支策略

## 特性分支

```
main （始终可部署）
  │
  ├── feature/task-creation    ← 每个功能一个分支
  ├── feature/user-settings    ← 并行工作
  └── fix/duplicate-tasks      ← Bug 修复
```

- 从 `main`（或团队的默认分支）分支
- 保持分支短暂（在 1-3 天内合并）——长期分支是隐性成本
- 合并后删除分支
- 优先使用特性标志而不是长期分支处理未完成功能

## 分支命名

```
feature/<简短描述>   → feature/task-creation
fix/<简短描述>       → fix/duplicate-tasks
chore/<简短描述>     → chore/update-deps
refactor/<简短描述>  → refactor/auth-module
```

## 使用工作树

对于并行 AI agent 工作，使用 git worktree 同时运行多个分支：

```bash
# 为特性分支创建工作树
git worktree add ../project-feature-a feature/task-creation
git worktree add ../project-feature-b feature/user-settings

# 每个工作树是带有自己分支的单独目录
# Agent 可以并行工作而不干扰
ls ../
  project/              ← main 分支
  project-feature-a/    ← task-creation 分支
  project-feature-b/    ← user-settings 分支

# 完成后，合并并清理
git worktree remove ../project-feature-a
```

好处：
- 多个 agent 可以同时处理不同功能
- 不需要分支切换（每个目录有自己的分支）
- 如果一个实验失败，删除工作树——不会丢失任何东西
- 变更在明确合并之前是隔离的

## 保存点模式

```
Agent 开始工作
    │
    ├── 进行更改
    │   ├── 测试通过？→ 提交 → 继续
    │   └── 测试失败？→ 恢复到最后一个提交 → 调查
    │
    ├── 进行另一个更改
    │   ├── 测试通过？→ 提交 → 继续
    │   └── 测试失败？→ 恢复到最后一个提交 → 调查
    │
    └── 功能完成 → 所有提交形成清晰历史
```

此模式意味着你永远不会丢失超过一个增量的工作。如果 agent 偏离轨道，`git reset --hard HEAD` 会带你回到最后一个成功状态。
