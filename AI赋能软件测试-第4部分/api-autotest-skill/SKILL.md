---
name: api-autotest-skill
description: Generate standardized interface test assets from API docs, curl, Swagger, Apifox, or Postman inputs. Follows a fixed pipeline: API info extraction → test element decomposition → test point matrix → parameterized case data → pytest + requests script draft → manual review checklist. Use when the user asks to generate API test cases, decompose test elements from curl/Swagger/Apifox, draft pytest automation scripts, review existing automation code quality, or design test data for login, CRUD, order, payment, and file upload APIs.
---

# 接口自动化测试流程复用 Skill

## 技能定位

将接口文档、curl、Swagger、Apifox、Postman 信息或已有代码，转化为可审查、可复用、可落地的接口测试资产。

不要直接把接口文档丢给 AI 一次性生成脚本。必须按以下工作方式推进：

1. 先整理接口资料。
2. 再拆解测试要素。
3. 再生成测试点矩阵。
4. 再转换为参数化用例数据。
5. 再起草 pytest + requests 脚本。
6. 最后输出人工审查清单。

## 必须先读的规则

每次执行本技能时，先读取：

- `rules/_sections.md`
- `rules/api-info-extraction.md`
- `rules/test-element-decomposition.md`
- `rules/test-point-matrix.md`
- `rules/case-data-design.md`
- `rules/pytest-script-rules.md`
- `rules/manual-review-checklist.md`

## 强制产出要求

1. 不要只在对话中输出结果，默认必须落地为 Markdown 文件。
2. 默认输出路径：`outputs/api-tests/<slug>.md`。
3. 最终回复必须给出文件路径，并简述包含哪些内容。
4. 如果接口信息不足，继续产出可用初稿，但缺失项必须标注「待确认」。

## 输入模式

支持以下输入：

- 接口文档、接口说明文本。
- curl 命令。
- Swagger / OpenAPI JSON 或 YAML。
- Apifox / Postman 导出数据。
- 已有接口自动化代码（审查模式）。
- 用户只描述接口功能，也可先补全测试分析框架。

## 标准工作流

复制以下清单并逐步完成：

```text
Task Progress:
- [ ] Step 1: 整理接口资料，输出接口资料解析表
- [ ] Step 2: 拆解测试要素，覆盖参数、业务、返回、鉴权、数据、安全六个维度
- [ ] Step 3: 生成测试点矩阵，按风险分层标注优先级
- [ ] Step 4: 生成参数化用例数据，转换为可断言的测试数据
- [ ] Step 5: 起草 pytest + requests 脚本初稿
- [ ] Step 6: 输出人工审查清单和待确认问题清单
- [ ] Step 7: 写入 Markdown 产物并返回路径
```

### Step 1：接口资料整理

从用户提供信息中提取：

- 接口名称、请求方法、请求路径。
- 请求头、请求参数（名称/类型/是否必填/说明）。
- 正常返回示例、错误码及说明。
- 鉴权方式、业务规则。
- 不能确定的信息标注「待确认」，不允许脑补。

### Step 2：测试要素拆解

从接口资料中拆出以下六个维度：

| 维度   | 说明                             |
| ---- | ------------------------------ |
| 参数校验 | 必填、为空、格式错误、长度边界、类型错误           |
| 业务规则 | 状态限制、唯一性、重复提交、权限边界             |
| 返回校验 | HTTP 状态、业务 code、message、核心字段   |
| 鉴权校验 | 无 token、token 错误、token 过期、权限不足 |
| 数据状态 | 正常数据、无效数据、已删除、已禁用、重复数据         |
| 安全风险 | 敏感信息泄露、越权、异常提示过细               |

### Step 3：生成测试点矩阵

按风险分层输出，不只列字段组合：

- P0：主流程、核心业务规则、鉴权问题。
- P1：常见异常、边界、错误提示。
- P2：低频兼容性、非核心组合。
- 「待确认」项不进入脚本，只进入问题清单。

### Step 4：生成用例数据

将测试点转换为参数化测试数据：

- `case_name` 必须表达业务含义，不允许写 case1、case2。
- 预期结果必须可断言。
- 不确定的业务 code 或 message 写「待确认」。
- 敏感数据必须脱敏。

### Step 5：起草 pytest + requests 脚本

- 使用 `pytest` + `requests`。
- 使用 `fixture` 管理 `base_url`、`session`、`token`。
- 使用参数化管理测试数据。
- 不硬编码真实域名、账号、密码、token。
- 请求必须设置 `timeout`。
- 断言不能只判断 `status_code`。
- 对不确定字段添加 `# TODO` 注释。

### Step 6：人工审查清单

脚本生成后必须输出标准审查清单，涵盖：接口路径、请求方法、参数完整性、鉴权方式、测试数据可复用性、硬编码检查、timeout 检查、断言完整性、业务 code/message 校验、敏感信息泄露风险。

## Markdown 输出模板

写入 Markdown 文件时使用以下结构：

```markdown
# <接口名称> 接口自动化测试设计

## 一、接口资料解析表

## 二、测试要素拆解
### 2.1 参数校验
### 2.2 业务规则
### 2.3 返回校验
### 2.4 鉴权校验
### 2.5 数据状态
### 2.6 安全风险

## 三、测试点矩阵
| 测试类别 | 测试点 | 输入数据 | 预期结果 | 优先级 | 是否适合自动化 |

## 四、参数化用例数据
| case_id | case_name | payload | expected_http_status | expected_biz_code | expected_message | expected_key_fields |

## 五、pytest + requests 脚本

## 六、人工审查清单
| 审查项 | 是否通过 | 问题说明 |

## 七、待确认问题清单
```

## 质量门槛

- 必须先整理接口资料，再生成测试点。
- 必须覆盖参数、业务、返回、鉴权、数据状态、安全六个维度中的适用维度。
- 必须有人工审查清单。
- 不确定内容必须标记「待确认」，不能当成事实。
- 自动化脚本必须可读、可维护、可审查。
- 测试点必须能回溯到接口资料或业务规则。

## 快速触发示例

- "根据下面这个登录接口，帮我生成接口测试点和 pytest 自动化脚本。"
- "这是一个 curl 请求，帮我拆解接口测试要素，并生成参数化用例。"
- "这是我已有的接口自动化代码，帮我检查断言是否合理，哪里需要优化。"
- "根据这个接口文档，输出测试点矩阵、用例数据和 pytest 脚本。"
