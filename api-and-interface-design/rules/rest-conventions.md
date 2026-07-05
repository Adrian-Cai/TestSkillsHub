# REST 规范细化

## HTTP 方法语义

| 方法 | 语义 | 幂等 | 安全 | 典型响应码 |
| --- | --- | --- | --- | --- |
| GET | 读取资源 | 是 | 是 | 200, 304, 404 |
| POST | 创建资源 | 否 | 否 | 201, 400, 409 |
| PUT | 全量替换资源 | 是 | 否 | 200, 201, 400 |
| PATCH | 部分更新资源 | 取决于实现 | 否 | 200, 400, 404 |
| DELETE | 删除资源 | 是 | 否 | 204, 404 |
| HEAD | 获取资源元信息 | 是 | 是 | 200, 404 |
| OPTIONS | 获取通信选项 | 是 | 是 | 200 |

### 关键约束

- **GET 不产生副作用**：查询操作不能修改数据，可用于缓存、预取
- **POST 非幂等**：重复调用产生不同结果（如创建多条记录）
- **PUT 幂等**：相同请求多次执行结果一致
- **DELETE 幂等**：删除已删除的资源返回 204（不是 404）

## 状态码精确使用

### 成功类 (2xx)

```
200 OK                  → 通用成功，GET/PATCH/DELETE 响应体
201 Created             → POST 创建成功，配合 Location header
202 Accepted            → 异步任务已接收，用于耗时操作
204 No Content          → 删除成功或无返回体的操作
206 Partial Content     → 断点续传，配合 Range header
```

### 重定向类 (3xx)

```
301 Moved Permanently   → 资源永久迁移，客户端应更新书签
304 Not Modified        → 条件请求命中缓存，配合 If-None-Match
```

### 客户端错误 (4xx)

```
400 Bad Request         → 通用客户端错误，JSON 格式错误、缺少必要字段
401 Unauthorized        → 未认证（注意：语义是"未认证"，不是"未授权"）
403 Forbidden           → 已认证但无权限
404 Not Found           → 资源不存在
405 Method Not Allowed  → HTTP 方法不支持
409 Conflict            → 资源冲突（重复创建、版本冲突）
422 Unprocessable Entity→ 格式正确但语义错误
429 Too Many Requests   → 限流触发
```

### 服务端错误 (5xx)

```
500 Internal Server Error → 服务端未知错误
502 Bad Gateway           → 网关/代理收到无效响应
503 Service Unavailable   → 服务暂时不可用（维护、过载）
504 Gateway Timeout       → 网关/代理超时
```

### 状态码禁忌

- **永远不要返回 200 表示业务失败**：错误码必须在 HTTP 状态码中体现
- **不要用 400 代替 404**：资源找不到就返回 404
- **不要用 401 代替 403**：已登录但没权限是 403，不是 401
- **不要吞掉 5xx**：5xx 意味着服务端有 bug 或需要运维介入

## Header 规范

### 必须使用的 Header

```
Content-Type: application/json; charset=utf-8    → 响应体格式
Location: /api/tasks/123                         → 201 响应，指向新资源
Cache-Control: no-cache                          → 动态数据禁止缓存
ETag: "33a64df5"                                 → 条件请求，配合 If-None-Match
Link: <...?page=2>; rel="next"                   → 分页导航
```

### 可选但推荐

```
X-Request-Id: uuid                               → 请求追踪，便于日志关联
X-RateLimit-Limit: 100                           → 限流上限
X-RateLimit-Remaining: 95                        → 剩余请求数
X-RateLimit-Reset: 1640995200                    → 限流重置时间（Unix 时间戳）
X-Total-Count: 142                               → 列表总数（替代 pagination.totalItems）
```

### Header 禁忌

- **不要暴露内部实现**：不返回 `X-Powered-By`、`Server` 等技术栈信息
- **不要在 Header 中放业务数据**：业务信息放 body
- **Date header 必须使用 UTC**：`Date: Mon, 01 Jan 2024 00:00:00 GMT`

## URL 设计规范

### 资源命名

```
✅ 正确
GET    /api/users
GET    /api/users/123
GET    /api/users/123/orders
POST   /api/orders

❌ 错误
GET    /api/user              → 应使用复数
GET    /api/getUser          → 不要有动词
GET    /api/user_list        → 不要用下划线
GET    /api/USER             → 大小写不一致
```

### 查询参数

```
# 过滤
GET /api/tasks?status=completed&assignee=user123

# 排序
GET /api/tasks?sortBy=createdAt&sortOrder=desc

# 字段选择（减少带宽）
GET /api/tasks?fields=id,title,status

# 搜索
GET /api/tasks?q=search+term

# 嵌套过滤（使用点号或方括号）
GET /api/tasks?filter[status]=completed
GET /api/tasks?filter.status=completed
```

### 路径层级

```
# 最多 3 层嵌套
GET /api/teams/123/projects/456/tasks        → 合理
GET /api/teams/123/projects/456/tasks/789/comments  → 过深，考虑扁平化

# 扁平化替代
GET /api/tasks?projectId=456                  → 更好
GET /api/tasks/789/comments                   → 用 taskId 过滤代替深层嵌套
```

## 批量操作

```
# 批量创建
POST /api/tasks/batch
{
  "tasks": [
    { "title": "Task 1" },
    { "title": "Task 2" }
  ]
}

# 批量更新
PATCH /api/tasks/batch
{
  "updates": [
    { "id": "123", "status": "completed" },
    { "id": "456", "status": "completed" }
  ]
}

# 批量删除
DELETE /api/tasks/batch?ids=123,456,789
```

## 内容协商

```
# 客户端指定格式
Accept: application/json
Accept: application/xml
Accept: text/csv

# 服务端不支持时
406 Not Acceptable
```

## 条件请求

```
# 获取 ETag
GET /api/tasks/123
→ ETag: "33a64df5"

# 条件请求（节省带宽）
GET /api/tasks/123
If-None-Match: "33a64df5"
→ 304 Not Modified（无 body）

# 乐观并发控制
PUT /api/tasks/123
If-Match: "33a64df5"
→ 200 OK（版本匹配）
→ 412 Precondition Failed（版本不匹配）
```
