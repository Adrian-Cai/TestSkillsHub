# AI 赋能软件测试 · 第 4 部分

## 本部分主题

**接口自动化测试流程复用**

## 核心 Skill

### `api-autotest-skill` — 接口自动化测试流程复用 Skill

#### Skill 目标

当提供接口文档、curl、Swagger、Apifox、Postman 信息或已有接口自动化代码时，辅助测试工程师完成标准化流程：

> 接口资料整理 → 测试要素拆解 → 测试点矩阵 → 用例数据设计 → pytest + requests 脚本起草 → 人工审查清单输出

#### 适用场景

1. 根据接口文档生成接口测试点。
2. 根据 curl、Swagger、Apifox、Postman 信息整理接口测试要素。
3. 根据接口信息生成 pytest + requests 自动化脚本。
4. 根据已有接口自动化代码进行结构优化和问题审查。
5. 根据登录、注册、查询、CRUD、下单、支付、上传等接口设计测试用例。
6. 将手工接口测试点转换成自动化测试数据。

#### 目录结构

```text
api-autotest-skill/
├── SKILL.md                        # Skill 主文件（入口）
├── agents/
│   └── openai.yaml                 # AI 接口配置
├── rules/
│   ├── _sections.md                # 规则索引
│   ├── api-info-extraction.md      # 接口资料整理规范
│   ├── test-element-decomposition.md  # 测试要素拆解规范
│   ├── test-point-matrix.md        # 测试点矩阵生成规范
│   ├── case-data-design.md         # 参数化用例数据设计规范
│   ├── pytest-script-rules.md      # pytest + requests 脚本生成规范
│   └── manual-review-checklist.md  # 人工审查清单输出规范
└── outputs/
    └── api-tests/                  # AI 生成的测试资产落地目录
```

#### 快速触发示例

```text
根据下面这个登录接口，帮我生成接口测试点和 pytest 自动化脚本。
```

```text
这是一个 curl 请求，帮我拆解接口测试要素，并生成参数化用例。
```

```text
这是我已有的接口自动化代码，帮我检查断言是否合理，哪里需要优化。
```

```text
根据这个接口文档，输出测试点矩阵、用例数据和 pytest 脚本。
```

#### 关键约束

- AI 只负责生成初稿，测试人员负责确认业务规则。
- 断言质量决定自动化价值，自动化不是发送请求，而是验证风险。
- 未知规则必须标记为「待确认」，所有真实账号、密码、token、域名必须脱敏。
- 脚本必须可读、可维护、可审查，测试点必须能回溯到接口资料或业务规则。

---

## 与其他部分的关系

| 部分 | 主题 |
| ---- | ---- |
| 第 1 部分 | AI 赋能软件测试基础 |
| 第 2 部分 | AI 辅助测试工具与流程 |
| 第 3 部分 | AI 辅助测试用例设计（功能测试） |
| **第 4 部分** | **接口自动化测试流程复用（本部分）** |
