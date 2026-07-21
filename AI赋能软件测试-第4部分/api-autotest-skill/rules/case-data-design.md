# 参数化用例数据设计规范

## 目标

将测试点矩阵中的测试点转化为结构化、可断言、可参数化的测试数据，直接服务于 pytest 参数化执行。

## 标准用例数据格式

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `case_id` | string | 用例编号，格式 `TC_001`、`TC_002` |
| `case_name` | string | 用例名称，必须表达业务含义 |
| `payload` | dict/JSON | 请求体参数（GET 请求用 `params`） |
| `headers` | dict | 请求头（如需特殊处理鉴权） |
| `expected_http_status` | int | 预期 HTTP 状态码 |
| `expected_biz_code` | int/string | 预期业务 code（不确定写「待确认」） |
| `expected_message` | string | 预期错误/成功 message（不确定写「待确认」） |
| `expected_key_fields` | dict | 预期返回的关键字段及其值/类型 |
| `should_contain_token` | bool | 成功场景是否应返回 token |
| `sensitive_fields_absent` | list | 失败场景中不应出现的敏感字段列表 |

## 用例命名规范

`case_name` 必须满足：

- 表达被测场景（哪个参数、哪个业务规则）。
- 表达预期行为（成功/失败/什么错误）。
- 不允许使用 case1、case2、测试1、测试2。

好的命名示例：
- `正常登录成功返回token`
- `用户名为空返回参数缺失错误`
- `密码错误返回认证失败`
- `无token访问需鉴权接口返回401`
- `已注销用户登录返回账号已禁用`

## 预期结果设计原则

### 不能只写 HTTP 200

```json
// 错误示例
"expected_http_status": 200

// 正确示例
"expected_http_status": 200,
"expected_biz_code": 0,
"expected_message": "success",
"expected_key_fields": {"token": "not_null", "user_id": "not_null"}
```

### 不确定的值写「待确认」

```json
// 文档未明确业务码时
"expected_biz_code": "待确认",
"expected_message": "待确认"
```

### 失败场景必须校验无敏感信息

```json
// 登录失败场景
"sensitive_fields_absent": ["password", "token", "secret"]
```

## JSON 格式参考模板

```json
[
  {
    "case_id": "TC_001",
    "case_name": "正常登录成功返回token",
    "payload": {
      "username": "${TEST_USER}",
      "password": "${TEST_PASSWORD}"
    },
    "headers": {},
    "expected_http_status": 200,
    "expected_biz_code": 0,
    "expected_message": "success",
    "expected_key_fields": {
      "token": "not_null",
      "user_id": "not_null"
    },
    "should_contain_token": true,
    "sensitive_fields_absent": ["password"]
  },
  {
    "case_id": "TC_002",
    "case_name": "用户名为空返回参数缺失错误",
    "payload": {
      "username": "",
      "password": "${TEST_PASSWORD}"
    },
    "headers": {},
    "expected_http_status": 200,
    "expected_biz_code": "待确认",
    "expected_message": "待确认",
    "expected_key_fields": {},
    "should_contain_token": false,
    "sensitive_fields_absent": ["password", "token"]
  },
  {
    "case_id": "TC_003",
    "case_name": "无token访问需鉴权接口返回401",
    "payload": {},
    "headers": {"Authorization": ""},
    "expected_http_status": 401,
    "expected_biz_code": "待确认",
    "expected_message": "待确认",
    "expected_key_fields": {},
    "should_contain_token": false,
    "sensitive_fields_absent": ["token", "password"]
  }
]
```

## 敏感数据处理规则

以下数据必须用环境变量占位符替换，不得硬编码：

| 数据类型 | 替换为 |
| -------- | ------ |
| 测试账号 | `${TEST_USER}` |
| 测试密码 | `${TEST_PASSWORD}` |
| 鉴权 token | `${AUTH_TOKEN}` |
| 域名/IP | `${BASE_URL}` |
| 手机号 | `${TEST_PHONE}` 或脱敏占位 |
| 身份证号 | `${TEST_ID_NUMBER}` 或脱敏占位 |

## 待确认项处理

- 用例中有「待确认」的字段，对应测试点必须同步出现在「待确认问题清单」中。
- 「待确认」不阻止生成脚本，但脚本中对应断言需加 `# TODO: 确认业务码` 注释。
- 当测试人员确认后，将「待确认」替换为实际值，同步更新断言逻辑。
