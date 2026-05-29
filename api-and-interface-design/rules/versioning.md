# 版本控制策略

## 版本号方案

### 语义化版本（Semantic Versioning）

```
MAJOR.MINOR.PATCH

MAJOR - 不兼容的 API 变更
MINOR - 向后兼容的功能新增
PATCH - 向后兼容的缺陷修复

示例：1.3.2 → 1.3.3（修复 bug）
      1.3.2 → 1.4.0（新增功能）
      1.3.2 → 2.0.0（破坏性变更）
```

## REST API 版本策略

### 方案一：URL 路径版本（推荐）

```
GET /api/v1/tasks
GET /api/v2/tasks
```

**优点**：直观、易于路由、便于缓存
**缺点**：URL 变更，需要维护多个版本

### 方案二：Header 版本

```
GET /api/tasks
Accept: application/vnd.myapi.v2+json
```

**优点**：URL 保持干净
**缺点**：调试不直观、缓存复杂

### 方案三：查询参数版本

```
GET /api/tasks?version=2
```

**优点**：简单
**缺点**：不标准、容易遗漏

### 推荐

- 公开 API：使用 URL 路径版本（`/api/v1/...`）
- 内部 API：尽量避免版本号，通过向后兼容扩展

## 向后兼容变更（安全）

### 可以直接发布的变更

| 变更类型 | 示例 | 风险 |
| --- | --- | --- |
| 新增可选字段 | `description?: string` | 低 |
| 新增端点 | `POST /api/v2/tasks` | 低 |
| 新增枚举值 | `status: 'archived'` | 中 |
| 放宽输入约束 | 更宽松的格式验证 | 低 |
| 新增查询参数 | `?include=comments` | 低 |
| 新增响应字段 | `response.additionalInfo` | 低 |

### 需要谨慎的变更

| 变更类型 | 风险 | 处理方式 |
| --- | --- | --- |
| 新增枚举值 | 已有代码可能没有 default 分支 | 通知消费者更新 |
| 收紧输入约束 | 拒绝之前接受的数据 | 先发警告，再强制 |
| 修改默认行为 | 行为变更可能影响现有用户 | 使用新版本 |
| 新增必填字段 | 现有请求会失败 | 使用新版本 |

## 破坏性变更（Breaking Change）

### 绝对禁止

```
❌ 删除字段
❌ 重命名字段
❌ 改变字段类型（string → number）
❌ 改变枚举值（'active' → 'ACTIVE'）
❌ 改变 HTTP 状态码含义
❌ 改变错误响应格式
❌ 改变认证机制
```

### 破坏性变更处理流程

```
1. 识别破坏性变更
2. 在 changelog 中明确标注
3. 创建新版本 API
4. 旧版本标记为 deprecated
5. 给消费者迁移时间（至少 6 个月）
6. 监控旧版本使用量
7. 使用量降至 0 后下线
```

## 废弃（Deprecation）流程

### 废弃响应头

```
HTTP 200 OK
Deprecation: true
Sunset: Sat, 01 Jan 2027 00:00:00 GMT
Link: <https://api.example.com/docs/v2-migration>; rel="successor-version"
```

### 废弃通知模板

```
# API 废弃通知

## 变更说明
`GET /api/v1/tasks` 将在 2027-01-01 后停止服务。

## 替代方案
请迁移到 `GET /api/v2/tasks`。

## 迁移指南
详见 [v2 迁移文档](https://api.example.com/docs/v2-migration)。

## 时间线
- 2025-06-01：v1 标记为 deprecated
- 2025-06-01 至 2026-12-31：v1 仍然可用，响应头包含 Deprecation 警告
- 2027-01-01：v1 下线
```

## 版本文档规范

### Changelog 格式

```markdown
# API Changelog

## 2025-06-01

### 新增
- `POST /api/v2/tasks` 支持批量创建
- `GET /api/v2/tasks` 新增 `assignee` 过滤参数

### 废弃
- `GET /api/v1/tasks` 将在 2027-01-01 下线
- 请迁移到 `GET /api/v2/tasks`

### 修复
- 修复分页 `totalItems` 计算错误

## 2025-03-01

### v2.0.0

#### 破坏性变更
- `GET /api/v2/tasks` 响应结构变更
  - `data[]` 字段类型从 `string` 改为 `object`
  - 新增 `pagination` 对象
- `POST /api/v2/tasks` 新增必填字段 `title`

#### 迁移指南
详见 [v2.0.0 迁移指南](/docs/migration/v2.0.0)
```

## 多版本维护策略

### 版本支持矩阵

```
版本    状态        支持周期
v3      活跃        当前版本
v2      维护中      安全修复至 2026-12-31
v1      已废弃      2027-01-01 下线
```

### 并行版本共存

```
# 路由配置
/api/v1/* → v1 handler
/api/v2/* → v2 handler

# 共享逻辑提取到 service 层
taskService.create()  → v1 和 v2 都调用
taskService.serializeV1() → v1 专用序列化
taskService.serializeV2() → v2 专用序列化
```

## GraphQL 版本策略

GraphQL 推荐不使用版本号，而是：

```
# 废弃字段而非删除
type Task {
  id: ID!
  title: String!
  name: String! @deprecated(reason: "Use 'title' instead")
}

# 客户端按需查询，只获取需要的字段
query {
  tasks {
    title  # 只查需要的字段
  }
}

# 新增字段不影响旧查询
type Task {
  id: ID!
  title: String!
  assignee: User  # 新增字段，旧查询不受影响
}
```
