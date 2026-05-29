# GraphQL Schema 设计规则

## Schema 命名规范

### 类型命名

```
✅ 正确
type User { ... }
type TaskConnection { ... }
input CreateTaskInput { ... }
enum TaskStatus { ... }

❌ 错误
type user { ... }          → 首字母大写
type task_connection { ... } → 使用 PascalCase
input createTaskInput { ... }
```

### 字段命名

```
✅ 正确（camelCase）
type Task {
  id: ID!
  title: String!
  createdAt: DateTime!
  isComplete: Boolean!
}

❌ 错误
type Task {
  task_id: ID!       → 应为 taskId
  created_at: DateTime! → 应为 createdAt
}
```

### 枚举命名

```
✅ 正确
enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

❌ 错误
enum TaskStatus {
  pending        → 应为 UPPER_SNAKE
  in_progress
}
```

## 查询设计

### 列表查询（Relay Connection 模式）

```graphql
# 查询定义
type Query {
  tasks(
    first: Int           # 每页数量
    after: String        # 游标分页
    filter: TaskFilter   # 过滤条件
    sort: TaskSort       # 排序
  ): TaskConnection!
}

type TaskConnection {
  edges: [TaskEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type TaskEdge {
  node: Task!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# 查询示例
query {
  tasks(first: 10, filter: { status: COMPLETED }) {
    edges {
      node {
        id
        title
        status
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

### 简单分页（非 Relay）

```graphql
type Query {
  tasks(
    page: Int = 1
    pageSize: Int = 20
    filter: TaskFilter
  ): TaskListResult!
}

type TaskListResult {
  data: [Task!]!
  pagination: PaginationInfo!
}

type PaginationInfo {
  page: Int!
  pageSize: Int!
  totalItems: Int!
  totalPages: Int!
}
```

## 变更设计

### 输入类型命名

```graphql
# 以 Input 结尾
input CreateTaskInput {
  title: String!
  description: String
  assigneeId: ID
}

input UpdateTaskInput {
  title: String
  description: String
  status: TaskStatus
}

input TaskFilter {
  status: TaskStatus
  assigneeId: ID
  createdAfter: DateTime
  createdBefore: DateTime
}
```

### 变更操作

```graphql
type Mutation {
  # 创建：接收 Input，返回创建的资源
  createTask(input: CreateTaskInput!): CreateTaskPayload!

  # 更新：接收 ID + Input，返回更新后的资源
  updateTask(id: ID!, input: UpdateTaskInput!): UpdateTaskPayload!

  # 删除：接收 ID，返回成功状态
  deleteTask(id: ID!): DeleteTaskPayload!
}

# 每个变更返回统一的 Payload
type CreateTaskPayload {
  task: Task!
  clientMutationId: String
}

type UpdateTaskPayload {
  task: Task!
  clientMutationId: String
}

type DeleteTaskPayload {
  deletedTaskId: ID
  clientMutationId: String
}
```

## 错误处理

### 字段级错误

```graphql
type CreateTaskPayload {
  task: Task
  errors: [UserError!]!
}

type UserError {
  field: String        # 出错字段，如 "title"
  code: String         # 错误码，如 "REQUIRED"
  message: String!     # 人类可读描述
}
```

### 查询级错误

```json
{
  "errors": [
    {
      "message": "Not authenticated",
      "locations": [{"line": 2, "column": 3}],
      "path": ["tasks"],
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ],
  "data": null
}
```

## 类型安全

### 非空标记

```graphql
type Task {
  id: ID!          # 永远不会为 null
  title: String!   # 永远不会为 null
  description: String  # 可以为 null
  assignee: User   # 可以为 null（未分配）
  tags: [String!]! # 永远返回数组，元素不为 null
}
```

### 使用 Scalar 类型

```graphql
scalar DateTime    # ISO 8601 格式
scalar JSON        # 任意 JSON
scalar URL         # 有效的 URL
scalar Email       # 有效的邮箱
scalar DateTime    # 日期时间
```

## 查询复杂度控制

### 深度限制

```javascript
// 建议最大深度：10-15 层
const depthLimit = require('graphql-depth-limit');
app.use('/graphql', depthLimit(10));
```

### 查询复杂度计算

```javascript
// 为每个字段定义复杂度
const complexityRules = {
  Query: {
    tasks: { complexity: 10 },
    user: { complexity: 5 },
  },
  Task: {
    comments: { complexity: 5 },
    subtasks: { complexity: 5 },
  }
};

// 限制最大复杂度：1000
// 防止恶意查询耗尽资源
```

### 分页限制

```graphql
# 强制分页，不允许一次查询所有数据
type Query {
  tasks(first: Int!): TaskConnection!
}

# first 最大值：100
# 默认值：20
```

## 预加载（N+1 问题）

### DataLoader 模式

```typescript
// 每个请求创建新的 DataLoader 实例
const userLoader = new DataLoader(async (ids: string[]) => {
  const users = await db.users.findByIds(ids);
  return ids.map(id => users.find(u => u.id === id));
});

// 在 Resolver 中使用
const resolvers = {
  Task: {
    assignee: (task) => userLoader.load(task.assigneeId),
  }
};
```

## 实时订阅

```graphql
type Subscription {
  # 订阅任务状态变更
  taskStatusChanged(taskId: ID): Task!

  # 订阅新评论
  commentAdded(taskId: ID!): Comment!
}

# 客户端订阅
subscription {
  taskStatusChanged(taskId: "123") {
    id
    status
    updatedAt
  }
}
```

## Schema 设计禁忌

| 问题 | 解决方案 |
| --- | --- |
| N+1 查询 | 使用 DataLoader |
| 无限深度嵌套 | 设置查询深度限制 |
| 暴露内部 ID | 使用全局唯一 ID |
| 缺少分页 | 所有列表强制分页 |
| 输入无校验 | 使用 Input 类型 + 校验 |
| 返回过多数据 | 让客户端只查询需要的字段 |

## 安全清单

- [ ] 查询深度限制（10-15 层）
- [ ] 查询复杂度限制（1000-5000）
- [ ] 分页强制（不允许无限制查询）
- [ ] 认证检查在 Resolver 层
- [ ] 敏感字段有权限控制
- [ ] 不暴露内部数据库 ID
- [ ] 日志不包含查询中的敏感数据
