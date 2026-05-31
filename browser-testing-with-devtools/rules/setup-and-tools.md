# 设置和可用工具

## 设置 Chrome DevTools MCP

### 安装

```bash
# 将 Chrome DevTools MCP 服务器添加到你的 Claude Code 配置
# 在你项目的 .mcp.json 或 Claude Code 设置中：
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["@anthropic/chrome-devtools-mcp@latest"]
    }
  }
}
```

### 可用工具

Chrome DevTools MCP 提供这些功能：

| 工具 | 功能 | 何时使用 |
|------|------|----------|
| **Screenshot** | 捕获当前页面状态 | 视觉验证、前后比较 |
| **DOM Inspection** | 读取实时 DOM 树 | 验证组件渲染、检查结构 |
| **Console Logs** | 检索控制台输出（log、warn、error） | 诊断错误、验证日志 |
| **Network Monitor** | 捕获网络请求和响应 | 验证 API 调用、检查有效负载 |
| **Performance Trace** | 记录性能时序数据 | 分析加载时间、识别瓶颈 |
| **Element Styles** | 读取元素的计算样式 | 调试 CSS 问题、验证样式 |
| **Accessibility Tree** | 读取可访问性树 | 验证屏幕阅读器体验 |
| **JavaScript Execution** | 在页面上下文中运行 JavaScript | 只读状态检查和调试（见安全边界） |
