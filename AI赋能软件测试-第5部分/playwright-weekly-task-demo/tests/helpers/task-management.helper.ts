import { expect, type FrameLocator, type Locator, type Page } from '@playwright/test';

type SearchScope = Page | FrameLocator | Locator;

export class TaskManagementHelper {
  readonly scheduleTime = process.env.SCHEDULE_TIME ?? '09:00';

  constructor(private readonly page: Page) {}

  async loginIfNeeded(): Promise<void> {
    await this.page.goto('/');
    let scope = await this.appScope();

    if (await this.findVisible([this.taskMenu(scope), scope.getByText(/任务管理/i)], false)) {
      return;
    }

    if (!(await this.findVisible([this.emailInput(scope)], false))) {
      await this.clickFirst(
        [
          scope.getByRole('link', { name: /登录|登\s*录|sign in|log in/i }),
          scope.getByRole('button', { name: /登录|登\s*录|sign in|log in/i }),
        ],
        '登录入口',
        false,
      );
    }

    scope = await this.appScope();
    if (!(await this.findVisible([this.emailInput(scope)], false))) {
      await this.page.goto('/login');
      scope = await this.appScope();
    }

    await this.fillFirst([this.emailInput(scope)], this.requiredEnv('AUTOTEST_EMAIL'), '邮箱输入框');
    await this.fillFirst([this.passwordInput(scope)], this.requiredEnv('AUTOTEST_PASSWORD'), '密码输入框');
    await this.clickFirst([scope.getByRole('button', { name: /登录|登\s*录|sign in|log in/i }), scope.locator('button[type="submit"]')], '登录按钮');

    await expect(this.taskMenu(scope).or(scope.getByText(/首页|工作台|仪表盘|控制台/i)).first())
      .toBeVisible({ timeout: 15_000 })
      .catch(async (error: Error) => {
        const loginError = await this.findVisible(
          [
            scope.getByText(/Please try again later|登录失败|账号或密码错误|请求过于频繁|稍后再试/i),
            scope.getByRole('alert'),
          ],
          false,
        );
        if (loginError) {
          throw new Error(`登录失败，页面提示：${await loginError.textContent()}`);
        }
        throw error;
      });
  }

  async openTaskManagement(): Promise<void> {
    const scope = await this.appScope();
    const expandNav = await this.findVisible(
      [
        scope.getByRole('button', { name: /展开导航|菜单|导航|menu/i }),
        scope.locator('button[title*="展开"], button[aria-label*="展开"], button[title*="导航"], button[aria-label*="菜单"]'),
      ],
      false,
    );

    if (expandNav) {
      await expandNav.click();
    }

    await this.clickFirst([this.taskMenu(scope), scope.getByText(/^任务管理$/)], '任务管理菜单');
    await expect(scope.getByRole('heading', { name: /任务管理/i }).or(scope.getByText(/任务管理/i)).first()).toBeVisible();
  }

  async openCreateTaskForm(): Promise<Locator> {
    const scope = await this.appScope();

    await this.clickFirst(
      [
        scope.getByRole('button', { name: /新建任务|创建任务|新增任务|新建|新增/i }),
        scope.getByText(/^(新建任务|创建任务|新增任务|新建|新增)$/),
      ],
      '新建任务按钮',
    );

    const dialog = scope.getByRole('dialog').filter({ hasText: /新建任务|创建任务|新增任务|任务名称/i }).first();
    await expect(dialog, '新建任务表单应打开').toBeVisible();
    return dialog;
  }

  async fillTaskName(form: Locator, taskName: string): Promise<void> {
    await this.fillFirst(
      [
        form.getByLabel(/任务名称|名称/i),
        form.getByPlaceholder(/请输入.*任务.*名称|任务名称/i),
        form.locator('input[name*="taskName" i], input[name="name"]'),
      ],
      taskName,
      '任务名称输入框',
    );
  }

  async setWeeklyMondaySchedule(form: Locator): Promise<void> {
    await this.chooseOption(form, /触发方式|触发类型|任务类型/i, /定时触发|定时任务|周期触发|Schedule/i, '触发方式');
    if (await this.setWeeklyMondayCronIfPresent(form)) {
      return;
    }

    await this.chooseOption(form, /执行周期|重复周期|周期|频率/i, /每周|按周|周|Weekly/i, '执行周期');
    await this.chooseMonday(form);
    await this.fillScheduleTimeIfPresent(form);

    // TODO: 如果真实页面还有“执行脚本”“任务描述”等必填字段，请在确认有效业务值后补充填写。
  }

  async saveTaskAndAssertSuccess(form: Locator): Promise<void> {
    await this.clickFirst(
      [form.getByRole('button', { name: /确定|保存|创建|提交/i }), form.locator('button[type="submit"]')],
      '保存任务按钮',
    );

    const scope = await this.appScope();
    await expect(scope.getByText(/创建成功|保存成功|操作成功|success/i).first(), '应出现成功提示').toBeVisible();
  }

  async assertTaskExists(taskName: string): Promise<void> {
    const scope = await this.appScope();
    await expect(this.taskTitle(scope, taskName), '任务列表应出现新建任务名称').toBeVisible();
  }

  async deleteTaskAndAssertRemoved(taskName: string): Promise<void> {
    const scope = await this.appScope();
    const taskTitle = this.taskTitle(scope, taskName);
    await expect(taskTitle, '删除前任务应存在于当前列表').toBeVisible();

    const taskCard = taskTitle.locator('xpath=ancestor::*[.//button][1]');
    await this.clickFirst(
      [
        taskCard.getByRole('button', { name: /更多|操作|菜单|more|actions/i }),
        taskCard.locator('button').last(),
      ],
      '任务操作菜单按钮',
    );

    await this.clickFirst(
      [
        this.page.getByRole('menuitem', { name: /删除|移除|Delete/i }),
        this.page.getByRole('button', { name: /删除|移除|Delete/i }),
        this.page.locator('[role="menuitem"], button').filter({ hasText: /删除|移除|Delete/i }),
        this.page.locator('.lucide-trash2, [class*="trash"], [data-icon*="trash"]').first(),
      ],
      '删除任务按钮',
    );

    const confirm = await this.findVisible(
      [
        this.page.getByRole('button', { name: /确认删除|确定删除|删除|确认|确定|Delete/i }),
        this.page.getByText(/确认删除|确定删除|删除任务/i),
      ],
      false,
    );
    if (confirm) {
      await confirm.click();
    }

    await expect(
      this.page
        .getByText(new RegExp(`${this.escapeRegExp(taskName)}.*已删除|已删除|删除成功|移除成功|操作成功|success`, 'i'))
        .first(),
      '应出现删除成功提示',
    ).toBeVisible();
    await this.assertTaskRemoved(taskName);
  }

  async assertTaskRemoved(taskName: string): Promise<void> {
    const scope = await this.appScope();
    await expect(this.taskTitle(scope, taskName), '删除后任务列表不应再出现该任务').toHaveCount(0);
  }

  async screenshotAfterSuccess(taskName: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${taskName}.png`,
      fullPage: true,
    });
  }

  private async appScope(): Promise<SearchScope> {
    return (await this.page.locator('iframe').count().catch(() => 0)) > 0
      ? this.page.frameLocator('iframe').first()
      : this.page;
  }

  private requiredEnv(name: 'AUTOTEST_EMAIL' | 'AUTOTEST_PASSWORD'): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`缺少环境变量 ${name}，请复制 .env.example 为 .env 后填写，或在命令行中注入。`);
    }
    return value;
  }

  private taskMenu(scope: SearchScope): Locator {
    return scope.getByRole('button', { name: /任务管理/i })
      .or(scope.getByRole('menuitem', { name: /任务管理/i }))
      .or(scope.getByRole('link', { name: /任务管理/i }));
  }

  private emailInput(scope: SearchScope): Locator {
    return scope.getByLabel(/邮箱|账号|用户名|email/i)
      .or(scope.getByPlaceholder(/邮箱|账号|用户名|email/i))
      .or(scope.locator('input[type="email"], input[name*="email" i], input[name*="username" i], input[name*="account" i]'));
  }

  private passwordInput(scope: SearchScope): Locator {
    return scope.getByLabel(/密码|password/i)
      .or(scope.getByPlaceholder(/密码|password/i))
      .or(scope.locator('input[type="password"]'));
  }

  private taskTitle(scope: SearchScope, taskName: string): Locator {
    return scope.getByRole('heading', { name: taskName }).or(scope.getByText(taskName, { exact: true })).first();
  }

  private async setWeeklyMondayCronIfPresent(scope: SearchScope): Promise<boolean> {
    const cronField = scope.locator('.ant-form-item, .el-form-item, .form-item, [class*="form-item"], [class*="field"]')
      .filter({ hasText: /Cron 表达式|Cron|表达式/i })
      .first();
    const cronInput = await this.findVisible(
      [
        scope.getByLabel(/Cron 表达式|Cron|表达式/i),
        scope.getByPlaceholder(/cron|例：0 2 \* \* \*|每天凌晨|标准5段/i),
        cronField.locator('input, textarea'),
      ],
      false,
    );
    const weeklyMondayPreset = await this.findVisible(
      [
        scope.getByRole('button', { name: /每周一|每周周一|周一|Monday/i }),
        cronField.getByRole('button', { name: /每周一|每周周一|周一|Monday/i }),
        cronField.getByText(/每周一|每周周一|周一|Monday/i),
      ],
      false,
    );

    if (!cronInput && !weeklyMondayPreset) {
      return false;
    }

    if (weeklyMondayPreset) {
      await weeklyMondayPreset.click();
    }

    if (cronInput) {
      await cronInput.fill(this.weeklyMondayCron());
      await expect(cronInput, 'Cron 表达式应设置为每周一 09:00').toHaveValue(this.weeklyMondayCron());
    }

    return true;
  }

  private weeklyMondayCron(): string {
    const [hour = '09', minute = '00'] = this.scheduleTime.split(':');
    return `${Number(minute)} ${Number(hour)} * * 1`;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async chooseOption(scope: SearchScope, fieldName: RegExp, optionName: RegExp, description: string): Promise<void> {
    const field = scope.locator('.ant-form-item, .el-form-item, .form-item, [class*="form-item"], [class*="field"]')
      .filter({ hasText: fieldName })
      .first();

    const inlineOption = await this.findVisible(
      [field.getByRole('button', { name: optionName }), field.getByRole('radio', { name: optionName }), field.getByText(optionName)],
      false,
    );
    if (inlineOption) {
      await inlineOption.click();
      return;
    }

    const trigger = await this.findVisible(
      [
        scope.getByLabel(fieldName),
        scope.getByRole('combobox', { name: fieldName }),
        field.getByRole('combobox'),
        field.locator('select, .ant-select-selector, .el-select, [role="combobox"]'),
      ],
      true,
      description,
    );

    if (await this.selectNativeOption(trigger!, optionName)) {
      return;
    }

    await trigger!.click();
    await this.clickFirst(
      [
        scope.getByRole('option', { name: optionName }),
        scope.locator('.ant-select-item-option, .el-select-dropdown__item').filter({ hasText: optionName }),
        scope.getByText(optionName),
      ],
      `${description}选项`,
    );
  }

  private async chooseMonday(scope: SearchScope): Promise<void> {
    const monday = await this.findVisible(
      [
        scope.getByRole('checkbox', { name: /周一|星期一|Monday/i }),
        scope.getByRole('radio', { name: /周一|星期一|Monday/i }),
        scope.getByRole('button', { name: /周一|星期一|Monday/i }),
        scope.getByLabel(/周一|星期一|Monday/i),
        scope.getByText(/^(周一|星期一|Monday)$/i),
      ],
      true,
      '周一选项',
    );

    if (await monday!.isChecked().catch(() => false)) {
      return;
    }
    await monday!.check().catch(async () => monday!.click());
  }

  private async fillScheduleTimeIfPresent(scope: SearchScope): Promise<void> {
    const input = await this.findVisible(
      [
        scope.getByLabel(/执行时间|触发时间|开始时间|时间/i),
        scope.getByPlaceholder(/请选择.*时间|请输入.*时间|HH:mm|时间/i),
        scope.locator('input[type="time"]'),
      ],
      false,
    );

    if (!input) {
      return;
    }

    await input.fill(this.scheduleTime).catch(async () => {
      await input.click();
      await input.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
      await input.pressSequentially(this.scheduleTime);
      await input.press('Enter');
    });
  }

  private async selectNativeOption(locator: Locator, optionName: RegExp): Promise<boolean> {
    const isSelect = await locator.evaluate((element) => element.tagName === 'SELECT').catch(() => false);
    if (!isSelect) {
      return false;
    }

    const matchedLabel = (await locator.locator('option').allTextContents())
      .map((label) => label.trim())
      .find((label) => optionName.test(label));

    if (!matchedLabel) {
      throw new Error(`原生下拉框中未找到选项：${optionName}`);
    }

    await locator.selectOption({ label: matchedLabel });
    return true;
  }

  private async fillFirst(candidates: Locator[], value: string, description: string): Promise<void> {
    const locator = await this.findVisible(candidates, true, description);
    await locator!.fill(value);
  }

  private async clickFirst(candidates: Locator[], description: string, required = true): Promise<void> {
    const locator = await this.findVisible(candidates, required, description);
    if (locator) {
      await locator.click();
    }
  }

  private async findVisible(candidates: Locator[], required: false, description?: string): Promise<Locator | null>;
  private async findVisible(candidates: Locator[], required: true, description?: string): Promise<Locator>;
  private async findVisible(candidates: Locator[], required: boolean, description?: string): Promise<Locator | null>;
  private async findVisible(candidates: Locator[], required: boolean, description = '元素'): Promise<Locator | null> {
    for (const candidate of candidates) {
      const count = await candidate.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const item = candidate.nth(index);
        if (await item.isVisible().catch(() => false)) {
          return item;
        }
      }
    }

    if (required) {
      throw new Error(`未找到可见元素：${description}`);
    }
    return null;
  }
}
