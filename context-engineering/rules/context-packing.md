# 上下文打包策略

## 脑力倾倒

在会话开始时，在结构化块中提供 agent 需要的所有内容：

```
项目上下文：
- 我们正在使用 [技术栈] 构建 [X]
- 相关规范部分是：[规范摘录]
- 关键约束：[列表]
- 涉及的文件：[带简短描述的列表]
- 相关模式：[指向示例文件的指针]
- 已知陷阱：[要避免的事项列表]
```

## 选择性包含

只包含与当前任务相关的内容：

```
任务：向注册端点添加邮箱验证

相关文件：
- src/routes/auth.ts（要修改的端点）
- src/lib/validation.ts（现有验证实用程序）
- tests/routes/auth.test.ts（要扩展的现有测试）

要遵循的模式：
- 参见 src/lib/validation.ts:45-60 中的手机号验证

约束：
- 必须使用现有的 ValidationError 类，而不是抛出原始错误
```

## 层次摘要

对于大型项目，维护摘要索引：

```markdown
# 项目地图

## 认证 (src/auth/)
处理注册、登录、密码重置。
关键文件：auth.routes.ts、auth.service.ts、auth.middleware.ts
模式：所有路由使用 authMiddleware，错误使用 AuthError 类

## 任务 (src/tasks/)
用户任务的 CRUD，带实时更新。
关键文件：task.routes.ts、task.service.ts、task.socket.ts
模式：通过 WebSocket 乐观更新，服务器协调

## 共享 (src/lib/)
验证、错误处理、数据库实用程序。
关键文件：validation.ts、errors.ts、db.ts
```

处理特定区域时只加载相关部分。
