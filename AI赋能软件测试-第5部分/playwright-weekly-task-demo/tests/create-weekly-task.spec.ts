import { test } from '@playwright/test';
import { TaskManagementHelper } from './helpers/task-management.helper';

test('登录后在任务管理中新建每周一触发的定时任务', async ({ page }) => {
  const task = new TaskManagementHelper(page);
  const taskName = `AI课堂演示-每周一任务-${Date.now()}`;

  await test.step('登录系统', async () => {
    await task.loginIfNeeded();
  });

  await test.step('进入任务管理页面', async () => {
    await task.openTaskManagement();
  });

  await test.step('新建每周一 09:00 执行的定时任务', async () => {
    const form = await task.openCreateTaskForm();
    await task.fillTaskName(form, taskName);
    await task.setWeeklyMondaySchedule(form);
    await task.saveTaskAndAssertSuccess(form);
    await task.assertTaskExists(taskName);
  });

  await test.step('保存成功后的页面截图', async () => {
    await task.screenshotAfterSuccess(taskName);
  });

  await test.step('删除新建任务并断言列表中不存在', async () => {
    await task.deleteTaskAndAssertRemoved(taskName);
  });
});
