# 使用 Git 进行调试

## 使用 Git 进行调试

```bash
# 查找哪个提交引入了 bug
git bisect start
git bisect bad HEAD
git bisect good <已知良好提交>
# Git 将检出中间提交；在每个上运行测试以缩小范围

# 查看最近更改了什么
git log --oneline -20
git diff HEAD~5..HEAD -- src/

# 查找谁最后更改了特定行
git blame src/services/task.ts

# 在提交消息中搜索关键字
git log --grep="validation" --oneline
```
