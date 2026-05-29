# 错误处理与响应模式

## 统一错误响应结构

所有 API 错误必须遵循同一个响应体格式：

```typescript
interface APIErrorResponse {
  error: {
    code: string;           // 机器可读错误码，如 "VALIDATION_ERROR"
    message: string;        // 人类可读描述
    details?: ErrorDetail[]; // 可选：具体错误字段列表
    request_id?: string;    // 可选：请求追踪 ID
  };
}

interface ErrorDetail {
  field?: string;           // 出错字段路径，如 "email" 或 "items[0].title"
  code: string;             // 字段级错误码，如 "REQUIRED", "INVALID_FORMAT"
  message: string;          // 字段级错误描述
}
```

### 响应示例

```json
// 单个错误
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数校验失败",
    "details": [
      { "field": "email", "code": "REQUIRED", "message": "邮箱不能为空" },
      { "field": "age", "code": "OUT_OF_RANGE", "message": "年龄必须在 0-150 之间" }
    ],
    "request_id": "req_abc123"
  }
}

// 资源不存在
{
  "error": {
    "code": "NOT_FOUND",
    "message": "用户不存在",
    "request_id": "req_abc123"
  }
}
```

## 错误码命名规范

### 通用错误码（全局复用）

| 错误码 | HTTP 状态码 | 含义 |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400/422 | 请求参数校验失败 |
| `UNAUTHORIZED` | 401 | 未认证 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突（重复创建、版本冲突） |
| `RATE_LIMITED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 服务内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务暂时不可用 |

### 业务错误码（按模块前缀）

```
TASK_NOT_FOUND          → 任务不存在
TASK_ALREADY_COMPLETED  → 任务已完成，不能重复操作
USER_EMAIL_DUPLICATE    → 邮箱已注册
ORDER_INSUFFICIENT_STOCK → 库存不足
PAYMENT_CARD_DECLINED   → 银行卡被拒绝
```

## 各 HTTP 状态码的响应体示例

### 400 Bad Request

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求格式错误",
    "details": [
      { "code": "INVALID_JSON", "message": "请求体不是合法的 JSON" }
    ]
  }
}
```

### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "请先登录"
  }
}
```

### 403 Forbidden

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "无权访问该资源"
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "任务不存在"
  }
}
```

### 409 Conflict

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "邮箱已被注册",
    "details": [
      { "field": "email", "code": "DUPLICATE", "message": "该邮箱已存在" }
    ]
  }
}
```

### 429 Too Many Requests

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "请求过于频繁，请稍后再试"
  }
}
```

## 错误处理禁忌

### 不要暴露内部信息

```
❌
{
  "error": {
    "message": "Error in /app/src/services/user.ts:142 - Cannot read property 'email' of undefined"
  }
}

✅
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "服务内部错误，请稍后重试"
  }
}
```

### 不要在错误消息中包含用户输入

```
❌
{
  "error": {
    "message": "User with email <script>alert(1)</script> already exists"
  }
}

✅
{
  "error": {
    "code": "CONFLICT",
    "message": "邮箱已被注册"
  }
}
```

### 不要使用 HTTP 状态码表示业务错误

```
❌ 用 200 表示业务失败
HTTP 200
{
  "success": false,
  "error_code": 1001,
  "error_msg": "余额不足"
}

✅ 使用正确的 HTTP 状态码
HTTP 422
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "账户余额不足"
  }
}
```

## 错误恢复建议

在错误响应中提供可操作的恢复建议：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "邮箱格式不正确",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "请输入有效的邮箱地址，如 user@example.com"
      }
    ]
  }
}
```

## 异步操作错误

对于异步任务（202 Accepted），错误在回调或轮询中返回：

```json
// 初始响应
HTTP 202 Accepted
{
  "task_id": "task_abc123",
  "status": "processing",
  "poll_url": "/api/tasks/task_abc123/status"
}

// 轮询状态 - 成功
GET /api/tasks/task_abc123/status
HTTP 200 OK
{
  "task_id": "task_abc123",
  "status": "completed",
  "result": { ... }
}

// 轮询状态 - 失败
GET /api/tasks/task_abc123/status
HTTP 200 OK
{
  "task_id": "task_abc123",
  "status": "failed",
  "error": {
    "code": "PROCESSING_FAILED",
    "message": "文件格式不支持"
  }
}
```
