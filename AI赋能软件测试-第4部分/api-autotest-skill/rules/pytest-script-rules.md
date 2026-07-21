# pytest + requests 脚本生成规范

## 目标

生成可读、可维护、可审查的 pytest + requests 接口自动化脚本初稿。

## 推荐目录结构

```text
api_test/
├── README.md             # 项目说明、运行方式、环境变量列表
├── requirements.txt      # 依赖声明
├── pytest.ini            # pytest 配置
├── .env.example          # 环境变量示例（不包含真实值）
├── conftest.py           # 全局 fixture
├── data/
│   └── <api_name>_cases.json   # 参数化测试数据
├── tests/
│   └── test_<api_name>_api.py  # 测试用例
└── utils/
    ├── api_client.py     # 封装请求工具
    └── assert_utils.py   # 封装断言工具
```

## 强制编码规则

### 1. 不硬编码敏感信息

```python
# 错误
BASE_URL = "https://api.yourcompany.com"
token = "eyJhbGciOi..."

# 正确
import os
BASE_URL = os.getenv("BASE_URL", "http://test.example.com")
token = os.getenv("AUTH_TOKEN")
```

### 2. 必须设置 timeout

```python
# 错误
response = session.post(url, json=payload)

# 正确
response = session.post(url, json=payload, timeout=10)
```

### 3. 断言不能只判断 status_code

```python
# 错误
assert response.status_code == 200

# 正确
assert response.status_code == 200
data = response.json()
assert data.get("code") == 0
assert data.get("token") is not None
assert "password" not in str(data).lower()
```

### 4. 业务 code 不确定时加 TODO

```python
# TODO: 确认业务失败码，文档未明确
# assert data.get("code") == 1001
```

### 5. 失败场景校验无敏感信息

```python
# 失败场景必须校验不返回敏感字段
for field in ["password", "token", "secret"]:
    assert field not in str(data).lower(), f"失败响应不应包含敏感字段: {field}"
```

## 标准模板

### conftest.py

```python
import os
import pytest
import requests


@pytest.fixture(scope="session")
def base_url():
    """从环境变量读取 base_url，不硬编码真实域名"""
    return os.getenv("BASE_URL", "http://test.example.com")


@pytest.fixture(scope="session")
def api_session():
    """创建共享 requests.Session，统一设置请求头"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    yield session
    session.close()


@pytest.fixture(scope="session")
def auth_token(api_session, base_url):
    """
    获取测试用 token。
    依赖环境变量 TEST_USER 和 TEST_PASSWORD。
    如果接口鉴权方式不同，修改此 fixture。
    """
    username = os.getenv("TEST_USER", "")
    password = os.getenv("TEST_PASSWORD", "")
    
    if not username or not password:
        pytest.skip("未配置 TEST_USER 或 TEST_PASSWORD 环境变量")
    
    response = api_session.post(
        f"{base_url}/login",
        json={"username": username, "password": password},
        timeout=10
    )
    assert response.status_code == 200
    data = response.json()
    token = data.get("token")
    assert token, "登录成功但未返回 token，请检查登录接口"
    return token
```

### tests/test_login_api.py

```python
import json
import os
import pytest

# 从 JSON 文件加载测试数据，保持代码与数据分离
def load_cases(filename):
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", filename)
    with open(data_path, encoding="utf-8") as f:
        return json.load(f)


LOGIN_CASES = [
    {
        "case_name": "正常登录成功返回token",
        "payload": {"username": os.getenv("TEST_USER", ""), "password": os.getenv("TEST_PASSWORD", "")},
        "expected_http_status": 200,
        "expected_biz_code": 0,
        "should_contain_token": True,
        "sensitive_fields_absent": ["password"],
    },
    {
        "case_name": "用户名为空返回参数缺失错误",
        "payload": {"username": "", "password": os.getenv("TEST_PASSWORD", "")},
        "expected_http_status": 200,
        "expected_biz_code": "待确认",  # TODO: 确认业务失败码
        "should_contain_token": False,
        "sensitive_fields_absent": ["password", "token"],
    },
    {
        "case_name": "密码错误返回认证失败",
        "payload": {"username": os.getenv("TEST_USER", ""), "password": "wrong_password_placeholder"},
        "expected_http_status": 200,
        "expected_biz_code": "待确认",  # TODO: 确认认证失败码
        "should_contain_token": False,
        "sensitive_fields_absent": ["password", "token"],
    },
]


@pytest.mark.parametrize(
    "case",
    LOGIN_CASES,
    ids=[case["case_name"] for case in LOGIN_CASES]
)
def test_login(api_session, base_url, case):
    """登录接口参数化测试"""
    response = api_session.post(
        f"{base_url}/login",
        json=case["payload"],
        timeout=10,
    )

    # 1. 校验 HTTP 状态码
    assert response.status_code == case["expected_http_status"], (
        f"HTTP 状态码不符，实际：{response.status_code}，期望：{case['expected_http_status']}"
    )

    data = response.json()

    # 2. 校验业务 code（待确认项跳过断言）
    if case["expected_biz_code"] != "待确认":
        assert data.get("code") == case["expected_biz_code"], (
            f"业务 code 不符，实际：{data.get('code')}，期望：{case['expected_biz_code']}"
        )

    # 3. 校验 token 存在性
    if case["should_contain_token"]:
        assert data.get("token"), "登录成功但响应中无 token"
    else:
        assert not data.get("token"), "失败场景不应返回 token"

    # 4. 校验失败响应不含敏感字段
    response_str = str(data).lower()
    for field in case.get("sensitive_fields_absent", []):
        assert field not in response_str, f"响应中不应包含敏感字段：{field}"
```

### utils/assert_utils.py

```python
def assert_no_sensitive_fields(data: dict, fields: list):
    """断言响应中不包含指定敏感字段"""
    response_str = str(data).lower()
    for field in fields:
        assert field not in response_str, f"响应不应包含敏感字段：{field}"


def assert_biz_code(data: dict, expected_code):
    """断言业务 code，跳过「待确认」项"""
    if expected_code == "待确认":
        return  # TODO: 确认业务码后补充断言
    assert data.get("code") == expected_code, (
        f"业务 code 不符，实际：{data.get('code')}，期望：{expected_code}"
    )


def assert_required_fields(data: dict, required_fields: list):
    """断言响应中必须包含的字段"""
    for field in required_fields:
        assert data.get(field) is not None, f"响应缺少必要字段：{field}"
```

### requirements.txt

```text
pytest>=7.0.0
requests>=2.28.0
python-dotenv>=1.0.0
pytest-html>=3.2.0
```

### .env.example

```text
# 测试环境基础 URL（不包含真实值）
BASE_URL=http://test.example.com

# 测试账号（不包含真实值）
TEST_USER=your_test_username
TEST_PASSWORD=your_test_password

# 鉴权 token（如果不通过登录接口获取）
AUTH_TOKEN=your_auth_token
```

## 脚本生成禁止项

生成脚本时，以下内容禁止出现：

| 禁止项 | 原因 |
| ------ | ---- |
| 真实域名 | 安全风险，应使用环境变量 |
| 真实账号密码 | 安全风险，应使用环境变量 |
| 真实 token | 安全风险，有效期短且会泄露 |
| 无 timeout 的请求 | 可能导致用例卡死 |
| 只断言 status_code 200 | 无法发现业务逻辑错误 |
| 未脱敏的手机号/身份证 | 个人信息保护风险 |
| 无注释的 TODO 项 | 待确认项必须有明确标注 |

## 「审查模式」脚本检查规则

当用户提交已有代码要求检查时，检查以下问题：

| 检查项 | 问题说明 |
| ------ | -------- |
| 断言过弱 | 只断言 200，未校验业务 code 和 message |
| 硬编码域名 | URL 直接写死，无法切换环境 |
| 硬编码账号密码 | 账号密码明文写在代码中 |
| 无 timeout | 请求未设置超时时间 |
| 鉴权处理不清晰 | token 来源不明确，或直接硬编码 |
| 数据不可复用 | 测试数据写在代码里，无法参数化 |
| 失败场景无断言 | 失败用例只判断返回了什么，未断言不应该返回什么 |
| 无 fixture 复用 | 重复代码多，session 和 token 每个用例都初始化 |
