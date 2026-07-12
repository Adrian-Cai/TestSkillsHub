---
name: ai-testcase-design
description: Generate and optimize software testing cases from product requirements, user stories, prototypes, or business rules by first decomposing business rules, then using scenario testing, equivalence classes, boundary values, decision tables, and state transition methods, followed by omission review, manual trimming, merging, and priority ranking. Use when the user asks to generate test cases from requirements, design test points, improve AI-generated cases, check missing scenarios, create reusable QA test case templates, or produce Markdown deliverables for functional testing.
---

# AI 辅助测试用例设计

## 技能定位

将需求、原型、用户故事或业务规则转成可评审、可执行、可排序的测试用例集。

不要直接把需求丢给 AI 一次性生成用例。必须按“需求输入 - AI 处理 - 人工审查 - 测试产出”的工作方式推进：

1. 先拆业务规则。
2. 再按测试设计方法生成。
3. 再反向检查遗漏。
4. 最后由测试人员裁剪、合并、排序。

## 必须先读的规则

每次执行本技能时，先读取：

- `rules/_sections.md`
- `rules/artifact-file-output.md`
- `rules/business-rule-analysis.md`
- `rules/test-design-methods.md`
- `rules/omission-review-rules.md`
- `rules/testcase-refine-priority.md`

## 强制产出要求

1. 不要只在对话中输出结果，默认必须落地为 Markdown 文件。
2. 默认输出路径：`outputs/testcases/<slug>.md`。
3. 最终回复必须给出文件路径，并简述包含哪些内容。
4. 如果需求信息不足，继续产出可用初稿，但必须列出“待确认问题”。

## 输入模式

支持以下输入：

- PRD、需求说明、用户故事、验收标准。
- 原型描述、页面交互说明、业务规则文本。
- 变更说明、Bug 修复说明、回归测试范围说明。
- 用户只给一个功能点，也可以先补齐测试分析框架。

## 标准工作流

复制以下清单并逐步完成：

```text
Task Progress:
- [ ] Step 1: 读取需求，拆解业务规则和待确认问题
- [ ] Step 2: 按测试设计方法生成测试点和用例初稿
- [ ] Step 3: 反向检查遗漏场景、异常场景和风险场景
- [ ] Step 4: 对用例进行裁剪、合并、粒度调整
- [ ] Step 5: 按业务风险和执行价值标注优先级
- [ ] Step 6: 写入 Markdown 产物并返回路径
```

### Step 1: 拆业务规则

从需求中提取：

- 业务对象、用户角色、前置条件。
- 主流程、分支流程、异常流程。
- 输入限制、时间限制、次数限制、金额限制。
- 状态变化、权限约束、数据依赖。
- 明确规则、隐含规则、待确认问题。

### Step 2: 按方法生成测试用例

至少覆盖以下测试设计方法：

- 场景法：主流程、分支流程、异常流程。
- 等价类：有效等价类、无效等价类。
- 边界值：金额、时间、次数、长度、数量等边界。
- 判定表：多条件组合下的系统行为。
- 状态迁移法：合法状态流转和非法状态流转。

### Step 3: 反向检查遗漏

让 AI 从测试负责人视角检查：

- 异常输入、边界值、权限差异。
- 重复操作、并发或重复提交。
- 状态流转、取消/回退/恢复。
- 数据一致性、历史缺陷高发点。
- 低价值、重复、不可执行用例。

### Step 4: 人工裁剪、合并、排序

AI 只给建议，测试人员负责最终判断：

- 删除业务不成立或低价值用例。
- 合并重复、相似、仅测试数据不同的用例。
- 拆分验证目标过多或失败定位困难的用例。
- 按 P0/P1/P2 标注优先级。

## Markdown 输出模板

写入 Markdown 文件时使用以下结构：

```markdown
# <功能名称> AI 辅助测试用例设计

## 一、需求与范围摘要

## 二、业务规则拆解
### 2.1 明确规则
### 2.2 隐含规则
### 2.3 待确认问题

## 三、测试设计方法覆盖
| 方法 | 覆盖重点 | 主要测试点 |
| --- | --- | --- |

## 四、测试用例初稿
| 用例编号 | 用例标题 | 方法 | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 五、遗漏检查与补充场景
| 遗漏点 | 补充场景 | 风险说明 | 是否建议纳入 | 优先级 |
| --- | --- | --- | --- | --- |

## 六、裁剪与合并建议
| 原用例 | 处理方式 | 原因 | 合并后用例 |
| --- | --- | --- | --- |

## 七、最终测试用例集
| 用例编号 | 用例标题 | 覆盖目标 | 前置条件 | 步骤 | 预期结果 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- |

## 八、执行建议

## 九、待确认问题
```

## 质量门槛

- 必须先拆规则，再生成用例。
- 必须覆盖正常、异常、边界、组合、状态、权限中的适用维度。
- 必须有遗漏检查结果。
- 必须有裁剪、合并或优先级判断。
- 高风险场景必须标注优先级理由。
- 不确定内容必须标记“待确认”，不能当成事实。

## 快速触发示例

- “根据这份需求生成测试用例，并让 AI 自查遗漏。”
- “帮我把这个功能点按场景法、等价类、边界值、判定表生成测试用例。”
- “检查这批 AI 生成的用例有没有遗漏，帮我合并和排序。”
- “把优惠券领取与使用功能整理成一份可执行测试用例集。”
