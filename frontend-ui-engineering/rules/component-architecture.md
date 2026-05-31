# 组件架构

## 文件结构

将组件相关的所有内容放在一起：

```
src/components/
  TaskList/
    TaskList.tsx          # 组件实现
    TaskList.test.tsx     # 测试
    TaskList.stories.tsx  # Storybook stories（如果使用）
    use-task-list.ts      # 自定义 hook（如果复杂状态）
    types.ts              # 组件特定类型（如果需要）
```

## 组件模式

**优先组合而非配置：**

```tsx
// 好：可组合
<Card>
  <CardHeader>
    <CardTitle>任务</CardTitle>
  </CardHeader>
  <CardBody>
    <TaskList tasks={tasks} />
  </CardBody>
</Card>

// 避免：过度配置
<Card
  title="任务"
  headerVariant="large"
  bodyPadding="md"
  content={<TaskList tasks={tasks} />}
/>
```

**保持组件专注：**

```tsx
// 好：做一件事
export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <li className="flex items-center gap-3 p-3">
      <Checkbox checked={task.done} onChange={() => onToggle(task.id)} />
      <span className={task.done ? 'line-through text-muted' : ''}>{task.title}</span>
      <Button variant="ghost" size="sm" onClick={() => onDelete(task.id)}>
        <TrashIcon />
      </Button>
    </li>
  );
}
```

**将数据获取与呈现分离：**

```tsx
// 容器：处理数据
export function TaskListContainer() {
  const { tasks, isLoading, error } = useTasks();

  if (isLoading) return <TaskListSkeleton />;
  if (error) return <ErrorState message="加载任务失败" retry={refetch} />;
  if (tasks.length === 0) return <EmptyState message="暂无任务" />;

  return <TaskList tasks={tasks} />;
}

// 呈现：处理渲染
export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul role="list" className="divide-y">
      {tasks.map(task => <TaskItem key={task.id} task={task} />)}
    </ul>
  );
}
```

## 状态管理

**选择最简单的方法：**

```
本地状态 (useState)           → 组件特定 UI 状态
提升状态                     → 2-3 个兄弟组件间共享
Context                      → 主题、认证、 locale（读多写少）
URL 状态 (searchParams)       → 过滤器、分页、可共享的 UI 状态
服务器状态 (React Query, SWR) → 带缓存的远程数据
全局存储 (Zustand, Redux)     → 全应用共享的复杂客户端状态
```

**避免超过 3 层的 prop drilling。** 如果你通过不使用它们的组件传递 props，引入 context 或重构组件树。
