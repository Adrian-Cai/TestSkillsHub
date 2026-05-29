# 安全设计

## 认证模式选择

### JWT（JSON Web Token）

```
适用场景：无状态服务、微服务间认证、移动端 API
```

```typescript
// Token 结构
interface JWT {
  header: { alg: "RS256"; typ: "JWT" };
  payload: {
    sub: string;        // 用户 ID
    iss: string;        // 签发方
    exp: number;        // 过期时间
    iat: number;        // 签发时间
    scope: string[];    // 权限范围
  };
  signature: string;
}

// 请求头
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

**安全要求**：
- 使用 RS256 或 ES256，**禁止使用 none 算法**
- Access Token 有效期 15-60 分钟
- Refresh Token 有效期 7-30 天，存储在 HttpOnly Cookie 中
- Token 中不放敏感信息（密码、身份证号等）

### OAuth 2.0

```
适用场景：第三方授权、单点登录（SSO）
```

```
# 授权码流程（推荐）
1. 客户端 → 授权服务器：/authorize?response_type=code&client_id=...
2. 用户授权 → 授权服务器回调：/callback?code=xxx
3. 客户端 → 授权服务器：/token（用 code 换 token）

# PKCE（公开客户端，如移动端/SPA）
- 额外生成 code_verifier 和 code_challenge
- 防止授权码被截获
```

### API Key

```
适用场景：服务间调用、低安全要求的公开 API
```

```
# 放在 Header 中
X-API-Key: your-api-key-here

# 或 Query Parameter（不推荐，易泄露到日志）
GET /api/data?api_key=xxx
```

**安全要求**：
- API Key 可随时轮换
- 限制调用 IP 或域名
- 定期审计使用情况

## 限流设计

### 响应头规范

```
X-RateLimit-Limit: 100           → 窗口内最大请求数
X-RateLimit-Remaining: 95        → 剩余请求数
X-RateLimit-Reset: 1640995200    → 窗口重置时间（Unix 时间戳）
Retry-After: 60                  → 被限流后，建议等待秒数
```

### 限流策略

```
# 固定窗口
每分钟 100 次请求
问题：窗口边界突发（14:00:59 发 100 次 + 14:01:01 发 100 次 = 2秒内 200 次）

# 滑动窗口（推荐）
过去 60 秒内最多 100 次请求，无边界问题

# 令牌桶
以固定速率添加令牌，请求消耗令牌，允许短期突发

# 按用户/IP/接口分别限流
- 匿名用户：10 次/分钟
- 登录用户：100 次/分钟
- VIP 用户：1000 次/分钟
- 写操作：10 次/分钟
- 读操作：100 次/分钟
```

### 限流响应

```json
HTTP 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "请求过于频繁，请在 60 秒后重试"
  }
}
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
```

## CORS 配置

```typescript
// 严格的 CORS 配置
const corsOptions = {
  origin: [
    'https://app.example.com',
    'https://admin.example.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit'],
  credentials: true,
  maxAge: 86400  // 预检请求缓存 24 小时
};
```

### CORS 禁忌

```
❌ origin: '*'               → 生产环境禁止
❌ Access-Control-Allow-Origin: null  → 不能信任
❌ 不限制 methods             → 只允许需要的方法
❌ 不限制 headers             → 只允许需要的头
```

## 输入安全

### SQL 注入防护

```typescript
// ❌ 字符串拼接
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// ✅ 参数化查询
const query = 'SELECT * FROM users WHERE id = $1';
const result = await db.query(query, [userId]);
```

### XSS 防护

```
# API 返回数据时
- Content-Type: application/json（不是 text/html）
- 不返回未转义的 HTML
- 用户生成内容在前端渲染时转义

# 存储层
- 清理 HTML 标签（如果业务允许富文本，使用白名单过滤）
- 存储原始数据，渲染时转义
```

### 文件上传安全

```
# 验证文件类型
- 检查 MIME type（Content-Type header）
- 检查文件头魔数（magic number），不要只依赖扩展名
- 限制文件大小

# 存储安全
- 重命名文件，不使用用户提供的文件名
- 存储在非 web 可访问目录
- 用独立域名提供文件下载（防止 Cookie 泄露）

# 允许的类型白名单
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif',
  'application/pdf',
  'text/csv'
];
```

### 请求体大小限制

```
# Express 示例
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb' }));

# Nginx 配置
client_max_body_size 1m;
```

## 敏感数据处理

### 永远不返回的字段

```
- password（密码哈希也不返回）
- salt（盐值）
- internal_id（数据库自增 ID，除非必要）
- session_token
- api_key
- secret
- credit_card（信用卡号）
- ssn（社会安全号码）
```

### 部分脱敏显示

```
手机号：138****1234
邮箱：zhang***@example.com
身份证：110***********1234
银行卡：6222 **** **** 1234
```

### 日志安全

```
# ❌ 禁止记录
- 密码、Token、API Key
- 完整的信用卡号
- 身份证号
- 个人隐私数据

# ✅ 应该记录
- 请求 ID
- 用户 ID（非敏感标识）
- 操作类型
- 时间戳
- IP 地址（注意 GDPR 合规）
- 脱敏后的手机号/邮箱
```

## HTTPS 强制

```
# HSTS 头（强制 HTTPS）
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# HTTP 重定向
301 Moved Permanently
Location: https://api.example.com/api/tasks
```

## 安全审计清单

- [ ] 所有 API 端点有认证/授权检查
- [ ] 输入验证在边界处完成
- [ ] SQL 使用参数化查询
- [ ] 敏感数据不在响应中暴露
- [ ] 日志不包含敏感信息
- [ ] CORS 配置严格
- [ ] 文件上传有类型和大小限制
- [ ] 限流已配置
- [ ] HTTPS 强制
- [ ] HSTS 头已设置
