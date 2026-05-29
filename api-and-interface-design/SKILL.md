---
name: API与接口设计
description: Guides stable API and interface design. Use when designing APIs, module boundaries, or any public interface. Use when creating REST or GraphQL endpoints, defining type contracts between modules, or establishing boundaries between frontend and backend.
---

# API and Interface Design

Design stable, well-documented interfaces that are hard to misuse. Good interfaces make the right thing easy and the wrong thing hard.

## When to Use

- Designing new API endpoints
- Defining module boundaries or contracts between teams
- Creating component prop interfaces
- Establishing database schema that informs API shape
- Changing existing public interfaces

## Rules Index

本 skill 包含以下规则文件，按需加载：

| 规则文件 | 说明 | 何时加载 |
| --- | --- | --- |
| `rules/rest-conventions.md` | REST 规范细化（HTTP 方法、状态码、Header） | 涉及 REST API 设计时读 |
| `rules/error-patterns.md` | 错误处理与响应模式 | 涉及错误设计时读 |
| `rules/auth-security.md` | 安全设计（鉴权、限流、CORS、输入安全） | 涉及安全相关设计时读 |
| `rules/versioning.md` | 版本控制策略与向后兼容 | 涉及版本管理或破坏性变更时读 |
| `rules/graphql-design.md` | GraphQL Schema 设计规则 | 涉及 GraphQL API 设计时读 |

## Core Principles

### Hyrum's Law

> With a sufficient number of users of an API, all observable behaviors of your system will be depended on by somebody, regardless of what you promise in the contract.

Every public behavior — including undocumented quirks, error message text, timing, and ordering — becomes a de facto contract once users depend on it.

### The One-Version Rule

Avoid forcing consumers to choose between multiple versions of the same dependency. Design for a world where only one version exists at a time — extend rather than fork.

### 1. Contract First

Define the interface before implementing it. The contract is the spec — implementation follows.

```typescript
interface TaskAPI {
  createTask(input: CreateTaskInput): Promise<Task>;
  listTasks(params: ListTasksParams): Promise<PaginatedResult<Task>>;
  getTask(id: string): Promise<Task>;
  updateTask(id: string, input: UpdateTaskInput): Promise<Task>;
  deleteTask(id: string): Promise<void>;
}
```

### 2. Consistent Error Semantics

Pick one error strategy and use it everywhere. See `rules/error-patterns.md` for full error response structure and status code mapping.

### 3. Validate at Boundaries

Trust internal code. Validate at system edges where external input enters:

```typescript
app.post('/api/tasks', async (req, res) => {
  const result = CreateTaskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid task data', details: result.error.flatten() },
    });
  }
  const task = await taskService.create(result.data);
  return res.status(201).json(task);
});
```

### 4. Prefer Addition Over Modification

Extend interfaces without breaking existing consumers — add optional fields, not required ones.

### 5. Predictable Naming

| Pattern | Convention | Example |
|---------|-----------|---------|
| REST endpoints | Plural nouns, no verbs | `GET /api/tasks` |
| Query params | camelCase | `?sortBy=createdAt` |
| Response fields | camelCase | `{ createdAt, updatedAt }` |
| Boolean fields | is/has/can prefix | `isComplete`, `hasAttachments` |
| Enum values | UPPER_SNAKE | `"IN_PROGRESS"` |

## REST API Patterns

### Resource Design

```
GET    /api/tasks              → List tasks
POST   /api/tasks              → Create a task
GET    /api/tasks/:id          → Get a single task
PATCH  /api/tasks/:id          → Update a task (partial)
DELETE /api/tasks/:id          → Delete a task
```

See `rules/rest-conventions.md` for detailed HTTP method semantics, status codes, Header规范, and URL设计.

## TypeScript Interface Patterns

### Discriminated Unions

```typescript
type TaskStatus =
  | { type: 'pending' }
  | { type: 'in_progress'; assignee: string }
  | { type: 'completed'; completedAt: Date };
```

### Input/Output Separation

```typescript
interface CreateTaskInput { title: string; description?: string; }
interface Task { id: string; title: string; createdAt: Date; updatedAt: Date; }
```

### Branded Types for IDs

```typescript
type TaskId = string & { readonly __brand: 'TaskId' };
type UserId = string & { readonly __brand: 'UserId' };
```

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "We'll document the API later" | The types ARE the documentation. Define them first. |
| "PATCH is complicated, let's just use PUT" | PUT requires the full object. PATCH is what clients want. |
| "We'll version the API when we need to" | Breaking changes without versioning break consumers. |
| "Nobody uses that undocumented behavior" | Hyrum's Law: if it's observable, somebody depends on it. |
| "Internal APIs don't need contracts" | Internal consumers are still consumers. |

## Red Flags

- Endpoints that return different shapes depending on conditions
- Inconsistent error formats across endpoints
- Validation scattered throughout internal code
- Breaking changes to existing fields
- List endpoints without pagination
- Verbs in REST URLs (`/api/createTask`)
- Third-party API responses used without validation

## Verification

After designing an API:

- [ ] Every endpoint has typed input and output schemas
- [ ] Error responses follow a single consistent format
- [ ] Validation happens at system boundaries only
- [ ] List endpoints support pagination
- [ ] New fields are additive and optional
- [ ] Naming follows consistent conventions
- [ ] API documentation or types are committed alongside the implementation
