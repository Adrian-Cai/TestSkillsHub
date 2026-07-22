# Playwright UI 自动化脚本：创建每周一定时任务

这套脚本用于演示并复用一个完整的 UI 自动化流程：登录系统，进入“任务管理”，新建一个每周一 09:00 触发的定时任务，并断言任务创建成功。

## 项目文件

- `package.json`：Playwright Test 依赖和常用运行命令。
- `playwright.config.ts`：浏览器、截图、录像、Trace、报告和超时配置。
- `.env.example`：环境变量模板，真实账号密码写到本地 `.env`。
- `tests/create-weekly-task.spec.ts`：可运行的 UI 自动化脚本，也是一份可复用模板。

## 安装依赖

```bash
npm install
npx playwright install chromium
```

## 配置账号

复制环境变量模板：

```powershell
Copy-Item .env.example .env
```

编辑 `.env`：

```env
BASE_URL=https://autotest.wiac.xyz
AUTOTEST_EMAIL=你的登录邮箱
AUTOTEST_PASSWORD=你的登录密码
TASK_NAME_PREFIX=Playwright课堂演示-每周一任务
SCHEDULE_TIME=09:00
WEEKLY_MONDAY_CRON=0 9 * * 1
HEADED=true
```

`.env` 已被 `.gitignore` 忽略，不要把真实密码提交到 Git。

## 运行脚本

课堂演示建议使用有头模式：

```bash
npm run test:headed
```

普通执行：

```bash
npm test
```

调试定位器：

```bash
npm run test:debug
```

查看 HTML 报告：

```bash
npm run report
```

## 可复用脚本结构

脚本按这个结构组织，后续创建其他 UI 自动化用例时可以直接复用：

1. `requireEnv()`：统一读取必需环境变量，避免账号密码硬编码。
2. `firstVisible()`：从多个候选定位器中选择第一个可见元素，提高兼容性。
3. `fillFirst()` / `clickFirst()`：封装输入和点击，减少重复代码。
4. `chooseOption()`：兼容原生 `select`、Ant Design、Element Plus 常见下拉框。
5. `setWeeklyMondaySchedule()`：优先填写 Cron 表达式 `0 9 * * 1`，没有 Cron 字段时再走“每周 + 周一 + 09:00”的表单控件。
6. `test.step()`：按登录、导航、填表、保存、断言拆分报告步骤。
7. 业务脚本只保留流程编排，定位器策略和控件兼容逻辑沉淀到 helper 函数里。

## 首次落地时重点调整

由于无法仅从需求确认登录后的真实 DOM，首次运行如果失败，优先检查这些定位器：

```ts
/任务管理/i
/新建任务|创建任务|新增任务|新建|新增/i
/任务名称|名称/i
/触发方式|触发类型|任务类型/i
/定时触发|定时任务|周期触发|Schedule/i
/执行周期|重复周期|周期|频率/i
/每周|按周|周|Weekly/i
/周一|星期一|Monday/i
/Cron 表达式|Cron|表达式/i
```

如果页面还有需求中没有说明的必填字段，脚本中已经保留 `TODO`。请先确认真实业务值，再补充自动化填写逻辑，不要为了让脚本通过而虚构数据。

## 人工审查清单

- 业务路径：登录后是否确实进入“任务管理”，新建入口是否是正确入口。
- 定位器：是否优先使用 `getByRole`、`getByLabel`、`getByPlaceholder`，避免长 XPath 和动态 class。
- 等待方式：是否通过断言和元素状态等待，没有用 `waitForTimeout()` 作为主等待。
- 测试数据：任务名称是否唯一，重复运行不会和历史数据冲突。
- 敏感信息：账号密码是否只来自 `.env`，没有写死在代码中。
- 断言结果：是否同时覆盖成功提示和列表中出现新任务。
- 失败产物：失败时是否保留截图、录像和 Trace；成功后是否保存页面截图。
- 业务未知项：所有无法从需求确定的必填字段是否保留 `TODO`，并经过人工确认后再补充。
