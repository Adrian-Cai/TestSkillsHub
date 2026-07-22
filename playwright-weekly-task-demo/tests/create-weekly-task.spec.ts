import { expect, FrameLocator, Locator, Page, test } from '@playwright/test';

const taskNamePrefix = process.env.TASK_NAME_PREFIX ?? 'Playwright课堂演示-每周一任务';
const scheduleTime = process.env.SCHEDULE_TIME ?? '09:00';
const weeklyMondayCron = process.env.WEEKLY_MONDAY_CRON ?? '0 9 * * 1';
type SearchScope = Page | FrameLocator | Locator;

function requireEnv(name: 'AUTOTEST_EMAIL' | 'AUTOTEST_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量 ${name}，请复制 .env.example 为 .env 后填写。`);
  }
  return value;
}

async function firstVisible(
  candidates: Locator[],
  description: string,
  required = true,
): Promise<Locator | null> {
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

async function fillFirst(candidates: Locator[], value: string, description: string): Promise<void> {
  const locator = await firstVisible(candidates, description);
  await locator!.fill(value);
}

async function clickFirst(candidates: Locator[], description: string): Promise<void> {
  const locator = await firstVisible(candidates, description);
  await locator!.click();
}

async function appScope(page: Page): Promise<SearchScope> {
  const iframeCount = await page.locator('iframe').count().catch(() => 0);
  return iframeCount > 0 ? page.frameLocator('iframe').first() : page;
}

async function selectNativeOption(select: Locator, optionName: RegExp): Promise<boolean> {
  const isSelect = await select.evaluate((element) => element.tagName === 'SELECT').catch(() => false);
  if (!isSelect) {
    return false;
  }

  const options = await select.locator('option').allTextContents();
  const matchedLabel = options.map((text) => text.trim()).find((text) => optionName.test(text));
  if (!matchedLabel) {
    throw new Error(`原生下拉框中未找到选项：${optionName}`);
  }

  await select.selectOption({ label: matchedLabel });
  return true;
}

async function chooseOption(
  scope: SearchScope,
  fieldName: RegExp,
  optionName: RegExp,
  description: string,
): Promise<void> {
  const labeledControl = await firstVisible(
    [
      scope.getByLabel(fieldName),
      scope.getByRole('combobox', { name: fieldName }),
      scope.getByRole('button', { name: fieldName }),
    ],
    description,
    false,
  );

  if (labeledControl && await selectNativeOption(labeledControl, optionName)) {
    return;
  }

  const fieldContainer = scope
    .locator('.ant-form-item, .el-form-item, .form-item, [class*="form-item"], [class*="field"]')
    .filter({ hasText: fieldName })
    .first();

  const inlineOption = await firstVisible(
    [
      fieldContainer.getByRole('button', { name: optionName }),
      fieldContainer.getByRole('radio', { name: optionName }),
      fieldContainer.getByText(optionName, { exact: false }),
    ],
    `${description} 的内联选项 ${optionName}`,
    false,
  );

  if (inlineOption) {
    await inlineOption.click();
    return;
  }

  const trigger = await firstVisible(
    [
      labeledControl ?? scope.locator('__never_matches__'),
      fieldContainer.getByRole('combobox'),
      fieldContainer.locator('select'),
      fieldContainer.locator('.ant-select-selector'),
      fieldContainer.locator('.el-select, .el-select__wrapper'),
      fieldContainer.locator('[role="combobox"]'),
    ],
    description,
  );

  if (await selectNativeOption(trigger!, optionName)) {
    return;
  }

  await trigger!.click();

  const option = await firstVisible(
    [
      scope.getByRole('option', { name: optionName }),
      scope.locator('.ant-select-item-option, .el-select-dropdown__item').filter({ hasText: optionName }),
      scope.getByText(optionName, { exact: false }),
    ],
    `${description} 的选项 ${optionName}`,
  );

  await option!.click();
}

async function chooseMonday(scope: SearchScope): Promise<void> {
  const monday = await firstVisible(
    [
      scope.getByRole('checkbox', { name: /周一|星期一|Monday/i }),
      scope.getByRole('radio', { name: /周一|星期一|Monday/i }),
      scope.getByRole('button', { name: /周一|星期一|Monday/i }),
      scope.getByLabel(/周一|星期一|Monday/i),
      scope.getByText(/^(周一|星期一|Monday)$/i),
    ],
    '周一选项',
  );

  const role = await monday!.getAttribute('role');
  const type = await monday!.getAttribute('type');
  const isCheckable = role === 'checkbox' || role === 'radio' || type === 'checkbox' || type === 'radio';

  if (isCheckable && !(await monday!.isChecked().catch(() => false))) {
    await monday!.check().catch(async () => monday!.click());
    return;
  }

  await monday!.click();
}

async function fillScheduleTimeIfPresent(scope: SearchScope): Promise<void> {
  const timeInput = await firstVisible(
    [
      scope.getByLabel(/执行时间|触发时间|开始时间|时间/i),
      scope.getByPlaceholder(/请选择.*时间|请输入.*时间|HH:mm|时间/i),
      scope.locator('input[type="time"]'),
    ],
    '执行时间输入框',
    false,
  );

  if (!timeInput) {
    return;
  }

  await timeInput.fill(scheduleTime).catch(async () => {
    await timeInput.click();
    await timeInput.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await timeInput.pressSequentially(scheduleTime);
    await timeInput.press('Enter');
  });
}

async function setWeeklyMondaySchedule(scope: SearchScope): Promise<void> {
  const cronInput = await firstVisible(
    [
      scope.getByLabel(/Cron 表达式|Cron|表达式/i),
      scope.getByPlaceholder(/cron|0 2 \* \* \*|每天凌晨/i),
    ],
    'Cron 表达式输入框',
    false,
  );

  if (cronInput) {
    await cronInput.fill(weeklyMondayCron);
    return;
  }

  await chooseOption(scope, /执行周期|重复周期|周期|频率/i, /每周|按周|周|Weekly/i, '执行周期下拉框');
  await chooseMonday(scope);
  await fillScheduleTimeIfPresent(scope);
}

async function login(page: Page): Promise<void> {
  await page.goto('/');
  let scope = await appScope(page);

  const loggedInMarker = await firstVisible(
    [
      scope.getByRole('button', { name: /任务管理|退出登录|个人资料/i }),
      scope.getByRole('heading', { name: /仪表盘|控制台|工作台|首页/i }),
    ],
    '已登录状态标识',
    false,
  );

  if (loggedInMarker) {
    return;
  }

  const existingEmailInput = await firstVisible(
    [
      scope.getByLabel(/邮箱|账号|用户名|email/i),
      scope.getByPlaceholder(/邮箱|账号|用户名|email/i),
      scope.locator('input[type="email"]'),
      scope.locator('input[name*="email" i], input[name*="username" i], input[name*="account" i]'),
    ],
    '邮箱输入框',
    false,
  );

  if (!existingEmailInput) {
    await clickFirst(
      [
        scope.getByRole('link', { name: /登录|登\s*录|sign in|log in/i }),
        scope.getByRole('button', { name: /登录|登\s*录|sign in|log in/i }),
      ],
      '登录入口',
    );
    await page.waitForLoadState('networkidle').catch(() => undefined);
  }

  const emailInputAfterClick = await firstVisible(
    [
      scope.getByLabel(/邮箱|账号|用户名|email/i),
      scope.getByPlaceholder(/邮箱|账号|用户名|email/i),
      scope.locator('input[type="email"]'),
      scope.locator('input[name*="email" i], input[name*="username" i], input[name*="account" i]'),
    ],
    '邮箱输入框',
    false,
  );

  if (!existingEmailInput && !emailInputAfterClick) {
    await page.goto('/login');
    scope = await appScope(page);
  }

  await fillFirst(
    [
      scope.getByLabel(/邮箱|账号|用户名|email/i),
      scope.getByPlaceholder(/邮箱|账号|用户名|email/i),
      scope.locator('input[type="email"]'),
      scope.locator('input[name*="email" i], input[name*="username" i], input[name*="account" i]'),
    ],
    requireEnv('AUTOTEST_EMAIL'),
    '邮箱输入框',
  );

  await fillFirst(
    [
      scope.getByLabel(/密码|password/i),
      scope.getByPlaceholder(/密码|password/i),
      scope.locator('input[type="password"]'),
    ],
    requireEnv('AUTOTEST_PASSWORD'),
    '密码输入框',
  );

  await clickFirst(
    [
      scope.getByRole('button', { name: /登录|登\s*录|sign in|log in/i }),
      scope.locator('button[type="submit"]'),
    ],
    '登录按钮',
  );

  await expect(
    scope
      .getByRole('button', { name: /任务管理/i })
      .or(scope.getByRole('link', { name: /任务管理/i }))
      .or(scope.getByRole('heading', { name: /仪表盘|控制台|工作台|首页/i }))
      .first(),
    '登录后应进入系统首页或可见业务菜单',
  ).toBeVisible();
}

test('在任务管理中新建每周一触发的定时任务', async ({ page }) => {
  const taskName = `${taskNamePrefix}-${Date.now()}`;
  let scope: SearchScope;
  let formScope: SearchScope;

  await test.step('登录系统', async () => {
    await login(page);
    scope = await appScope(page);
  });

  await test.step('进入任务管理页面', async () => {
    await clickFirst(
      [
        scope.getByRole('button', { name: /任务管理/i }),
        scope.getByRole('menuitem', { name: /任务管理/i }),
        scope.getByRole('link', { name: /任务管理/i }),
        scope.getByText(/^任务管理$/),
      ],
      '任务管理菜单',
    );

    await expect(
      scope
        .getByRole('heading', { name: /任务管理/i })
        .or(scope.getByText(/任务管理/i))
        .first(),
    ).toBeVisible();
  });

  await test.step('打开新建任务表单', async () => {
    await clickFirst(
      [
        scope.getByRole('button', { name: /新建任务|创建任务|新增任务|新建|新增/i }),
        scope.getByText(/^(新建任务|创建任务|新增任务|新建|新增)$/),
      ],
      '新建任务按钮',
    );

    const dialog = scope.getByRole('dialog', { name: /新建任务|创建任务|新增任务/i }).first();
    await expect(dialog, '新建任务弹窗应打开').toBeVisible();
    formScope = dialog;
  });

  await test.step('填写任务名称', async () => {
    await fillFirst(
      [
        formScope.getByLabel(/任务名称|名称/i),
        formScope.getByPlaceholder(/请输入.*任务.*名称|任务名称/i),
        formScope.locator('input[name*="taskName" i], input[name="name"]'),
      ],
      taskName,
      '任务名称输入框',
    );
  });

  await test.step('设置定时触发规则', async () => {
    await chooseOption(formScope, /触发方式|触发类型|任务类型/i, /定时触发|定时任务|周期触发|Schedule/i, '触发方式');
    await setWeeklyMondaySchedule(formScope);

    // TODO: 如果真实页面还有“执行脚本”“任务描述”等必填业务字段，
    // 请在确认有效业务值后补充填写，不能在自动化脚本里虚构数据。
  });

  await test.step('保存任务并断言结果', async () => {
    await clickFirst(
      [
        formScope.getByRole('button', { name: /确定|保存|创建|提交/i }),
        formScope.locator('button[type="submit"]'),
      ],
      '保存任务按钮',
    );

    const successMessage = scope.getByText(/创建成功|保存成功|操作成功|success/i).first();
    const taskRow = scope.getByText(taskName, { exact: true }).first();

    await expect(successMessage, '应提示创建成功').toBeVisible();
    await expect(taskRow, '任务列表中应显示新创建的任务').toBeVisible();

    await page.screenshot({
      path: `test-results/screenshots/${taskName}.png`,
      fullPage: true,
    });
  });
});
