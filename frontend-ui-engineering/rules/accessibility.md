# 可访问性

## 可访问性 (WCAG 2.1 AA)

每个组件必须满足这些标准：

### 键盘导航

```tsx
// 每个交互元素必须可键盘访问
<button onClick={handleClick}>点击我</button>        // ✓ 默认可聚焦
<div onClick={handleClick}>点击我</div>               // ✗ 不可聚焦
<div role="button" tabIndex={0} onClick={handleClick}    // ✓ 但优先使用 <button>
     onKeyDown={e => e.key === 'Enter' && handleClick()}>
  点击我
</div>
```

### ARIA 标签

```tsx
// 为缺少可见文本的交互元素添加标签
<button aria-label="关闭对话框"><XIcon /></button>

// 为表单输入添加标签
<label htmlFor="email">邮箱</label>
<input id="email" type="email" />

// 或在没有可见标签时使用 aria-label
<input aria-label="搜索任务" type="search" />
```

### 焦点管理

```tsx
// 内容更改时移动焦点
function Dialog({ isOpen, onClose }: DialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  // 打开时在对话框内捕获焦点
  return (
    <dialog open={isOpen}>
      <button ref={closeRef} onClick={onClose}>关闭</button>
      {/* 对话框内容 */}
    </dialog>
  );
}
```

### 有意义的空状态和错误状态

```tsx
// 不要显示空白屏幕
function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div role="status" className="text-center py-12">
        <TasksEmptyIcon className="mx-auto h-12 w-12 text-muted" />
        <h3 className="mt-2 text-sm font-medium">暂无任务</h3>
        <p className="mt-1 text-sm text-muted">开始创建新任务吧。</p>
        <Button className="mt-4" onClick={onCreateTask}>创建任务</Button>
      </div>
    );
  }

  return <ul role="list">...</ul>;
}
```
