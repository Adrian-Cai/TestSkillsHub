---
name: api-autotest-engineering-skill
description: Generate enterprise-level API automation testing assets from curl, Swagger, Apifox, Postman, API documents, or existing code. Must first analyze the existing automation framework, learn project conventions, then generate test analysis, test cases, pytest automation scripts, and review reports following the current project architecture.
---

# 接口自动化测试工程化 Skill

## 技能定位

将接口信息和已有自动化工程代码转换为符合项目规范的测试资产。

支持输入：

- curl 命令
- Swagger / OpenAPI
- Apifox / Postman
- 接口文档
- 已有接口自动化代码
- 用户描述的业务接口

目标：

不是生成独立 Demo。

而是：

读取当前自动化工程上下文 → 理解已有规范 → 设计测试方案 → 生成符合项目结构的自动化代码。

## 核心执行原则

禁止：

- 不读取项目结构直接生成脚本
- 不参考已有测试代码直接创建新的代码风格
- 不硬编码环境变量、token、账号密码
- 不将不确定业务规则当成事实

必须：

1. 优先分析当前自动化项目
2. 优先复用已有公共能力
3. 遵循已有代码风格
4. 所有不确定内容标记「待确认」

## 标准工作流（必须执行）

### Step 0：自动化项目上下文分析

如果当前环境存在自动化项目，必须先扫描：

目录结构：

- tests
- testcase
- api
- common
- utils
- config

识别：

### 测试框架

例如：

- pytest
- unittest
- pytest + requests
- pytest + allure

### 公共组件

分析：

- request 封装
- session 管理
- token 获取
- 数据读取方式
- 断言工具
- 日志组件

### 配置管理

检查：

- pytest.ini
- conftest.py
- yaml
- json
- env 文件

### 已有测试案例

读取：

- 最近 3 个接口测试文件
- 同业务模块测试文件

学习：

- 文件命名规则
- class 结构
- fixture 使用方式
- allure 标签规范
- assert 写法

输出：

《自动化框架分析报告》

包含：

- 当前框架
- 用例目录
- 请求封装方式
- 数据管理方式
- 代码生成规范

如果无法读取项目：

明确：

“当前缺少自动化项目上下文，将按照通用 pytest + requests 规范生成。”

### Step 1：接口资料解析

从输入中提取：

- 接口名称
- 请求方法
- URL
- Headers
- Query 参数
- Body 参数
- 鉴权方式
- 返回结构
- 错误码
- 业务规则

输出：

接口信息解析表。

不能确定的信息：

标记：

「待确认」

禁止：

自行补充业务逻辑。

### Step 2：接口信息完整性检查

生成接口完整度检查：

检查：

- 是否存在请求方法
- 是否存在 URL
- 是否存在 Headers
- 是否存在请求参数
- 是否存在鉴权信息
- 是否存在成功响应
- 是否存在业务 code 规则

输出：

接口信息评分：

例如：

完整度：80%

缺失：

- token 获取方式
- 成功响应示例
- 错误码定义

缺失内容：

进入待确认列表。

### Step 3：测试要素拆解

必须覆盖：

#### 参数校验

包括：

- 必填
- 空值
- 类型
- 长度
- 格式
- 边界

#### 业务规则

包括：

- 状态限制
- 重复提交
- 唯一性
- 权限控制

#### 返回校验

包括：

- HTTP 状态码
- business code
- message
- 核心字段

#### 鉴权校验

包括：

- 无 token
- token 错误
- token 过期
- 权限不足

#### 数据状态

包括：

- 正常数据
- 不存在数据
- 删除数据
- 禁用数据

#### 安全风险

包括：

- 敏感信息泄露
- 越权
- 参数污染

### Step 4：测试点矩阵设计

按照风险等级输出：

P0：

核心业务流程

P1：

常见异常和边界

P2：

低频兼容问题

每个测试点必须包含：

|字段|说明|
|-|-|
|测试场景|测试什么|
|输入数据|如何输入|
|预期结果|如何判断|
|优先级|P0/P1/P2|
|自动化建议|是否适合自动化|

### Step 5：参数化测试数据设计

生成：

pytest 参数化数据。

要求：

case_name：

必须描述业务含义。

禁止：

case1
case2

示例：

正确登录
密码为空
token 失效

数据：

必须脱敏。

### Step 6：按照项目规范生成自动化代码

生成优先级：

#### Level 1

复用当前项目已有封装。

例如：

request 工具：

common/request.py

断言：

common/assert_utils.py

配置：

config/*.yaml

#### Level 2

如果项目没有封装：

创建基础：

pytest + requests 结构。

#### Level 3

如果只是演示：

生成独立 Demo。

代码要求：

- pytest
- requests
- fixture
- 参数化
- timeout
- 日志
- 可维护断言

禁止：

硬编码：

- URL
- token
- 密码
- 测试账号

### Step 7：代码审查与资产输出

生成：

#### 自动化代码 Review

检查：

- 请求方式
- 参数完整性
- 断言合理性
- 是否复用公共组件
- 是否存在硬编码
- 是否存在安全问题

#### 输出测试资产

目录：

outputs/api-tests/<接口名称>/

包含：

```
README.md

接口分析.md

测试点矩阵.md

测试数据.yaml

test_xxx.py

review-report.md
```

### 最终输出模板

# 接口自动化测试设计

## 一、自动化框架分析

## 二、接口资料解析

## 三、接口完整性检查

## 四、测试要素拆解

## 五、测试点矩阵

## 六、参数化测试数据

## 七、自动化测试代码

## 八、代码Review报告

### 质量门槛

必须满足：

- 已分析自动化框架
- 已学习已有测试代码
- 测试点可追溯
- 代码符合项目规范
- 不确定内容明确标记
- 输出人工Review清单
