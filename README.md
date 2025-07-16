# 实时聊天应用

[![部署到 Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/durable-chat-template)

![模板预览](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/da00d330-9a3b-40a2-e6df-b08813fb7200/public)

<!-- dash-content-start -->

使用此模板，您可以部署自己的聊天应用，与其他用户进行实时对话。访问[演示网站](https://durable-chat-template.templates.workers.dev)会根据 URL 中的 ID 将您放入一个独特的聊天室。与他人分享该 ID 即可与他们聊天！这由 [Durable Objects](https://developers.cloudflare.com/durable-objects/) 和 [PartyKit](https://www.partykit.io/) 提供支持。

## 工作原理

用户首次访问页面时会被分配到自己的聊天室，可以通过分享房间 URL 与他人交谈。当有人加入聊天室时，会与存储和同步聊天历史记录的 [Durable Object](https://developers.cloudflare.com/durable-objects/) 建立 WebSocket 连接。

管理聊天室的 Durable Object 实例在一个位置运行，处理所有传入的 WebSocket 连接。聊天消息使用 [Durable Object SQL Storage API](https://developers.cloudflare.com/durable-objects/api/sql-storage/) 进行存储和检索。当新用户加入房间时，会从该房间的 Durable Object 中检索现有的聊天历史记录。当用户发送聊天消息时，消息会存储在该房间的 Durable Object 中，并通过 WebSocket 连接广播给该房间中的所有其他用户。此模板使用 [PartyKit Server API](https://docs.partykit.io/reference/partyserver-api/) 来简化连接管理逻辑，但也可以单独使用 Durable Objects 来实现。

<!-- dash-content-end -->

## 快速开始

在此仓库之外，您可以使用 [C3](https://developers.cloudflare.com/pages/get-started/c3/)（`create-cloudflare` CLI）通过此模板启动新项目：

```
npm create cloudflare@latest -- --template=cloudflare/templates/durable-chat-template
```

此模板的在线演示部署可在 [https://durable-chat-template.templates.workers.dev](https://durable-chat-template.templates.workers.dev) 查看

## 设置步骤

1. 使用您选择的包管理器安装项目依赖：
   ```bash
   npm install
   ```
2. 部署项目！
   ```bash
   npx wrangler deploy
   ```
