# 提交前卫生

## 提交前卫生

每次提交前：

```bash
# 1. 检查你即将提交的内容
git diff --staged

# 2. 确保没有机密
git diff --staged | grep -i "password\|secret\|api_key\|token"

# 3. 运行测试
npm test

# 4. 运行 lint
npm run lint

# 5. 运行类型检查
npx tsc --noEmit
```

使用 git hooks 自动化此过程：

```json
// package.json（使用 lint-staged + husky）
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## 处理生成文件

- **提交生成文件**仅当项目期望它们时（例如 `package-lock.json`、Prisma 迁移）
- **不要提交**构建输出（`dist/`、`.next/`）、环境文件（`.env`）或 IDE 配置（`.vscode/settings.json` 除非共享）
- **有 `.gitignore`** 覆盖：`node_modules/`、`dist/`、`.env`、`.env.local`、`*.pem`
