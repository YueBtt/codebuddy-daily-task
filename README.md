# 腾讯 CodeBuddy 自动签到与保活脚本 (Quantumult X 任务订阅)

把腾讯 CodeBuddy (AI 代码助手) 账号的每日签到与活跃连登自动化，定时获取算力点数并保持连登状态。

## 📌 核心功能
- **每日签到领算力**：每日自动打点，每次到账 **+100 Credits** 算力权益包。
- **活跃上报点亮连登**：模拟真实客户端事件链，点亮 `streak` 连登天数，解锁连登管家与专属权益。
- **资产查询与通知**：签到完成后自动查询当前所有可用算力账本，发送系统原生横幅推送通知。

## ⏰ 定时与执行规则
- **腾讯签到周期**：每日刷新时间为 **北京时间 00:00 (CST)**。每个自然日仅可签到一次。
- **推荐调度频次**：每天早晚各执行一次（**`0 9,21 * * *`** 即每天 09:00 与 21:00 执行）。避免单一时点网络抖动漏签，上游对重复签到幂等安全处理（返回 `今天已签到`，不封号不上风控）。

## 🚀 Quantumult X 配置方法

### 方式一：快捷 task_local 本地任务
在 `[task_local]` 模块下添加如下配置：

```ini
[task_local]
0 9,21 * * * https://raw.githubusercontent.com/YueBtt/codebuddy-daily-task/main/codebuddy_checkin.js, tag=腾讯CodeBuddy自动签到保活, img-url=https://raw.githubusercontent.com/DGZSbot/ai-icon/refs/heads/main/WorkBuddy.png, enabled=true
```

### 方式二：凭证配置（脱敏机制）
脚本支持从 Quantumult X 本地存储动态读取凭据，绝不泄露个人 Token：
- 打开 BoxJS 或使用快捷指令在 QX 中写入对应键值：
  - `codebuddy_token`：填入你的腾讯 CodeBuddy `AccessToken`。
  - `codebuddy_uid`：填入你的腾讯用户 `UID`（可选）。
- 若手机本地运行有 8088 Antigravity 代理，脚本会自动无缝直连本地缓存的授权凭证。

## 🛡️ 安全与脱敏声明
本项目开源代码已彻底剥离所有个人敏感 Token 与内网隐私信息，仅提供纯逻辑协议脚本。请妥善保管个人授权凭据，严禁对外公开发布包含个人真实密钥的配置！
