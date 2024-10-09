# 本仓库来源于 [Archeb/pplx-proxy (github.com)](https://github.com/Archeb/pplx-proxy) ，我只是在其基础上进行的简单修改。

# PPLX-Proxy: Perplexity AI 代理服务

这个仓库提供了一个代理服务，允许用户通过标准的 OpenAI API 格式访问 Perplexity AI 的 Claude 模型。

## 主要功能

1. **API 转换**: 将 OpenAI API 格式的请求转换为 Perplexity AI 可以理解的格式，并将响应转换回 OpenAI API 格式。
2. **流式响应**: 支持流式 API 响应，实时返回 AI 生成的内容。
3. **认证机制**: 实现了基本的 API 令牌验证，确保只有授权用户可以访问代理服务。
4. **错误处理**: 包含基本的错误处理和日志记录功能。
5. **Docker 支持**: 提供 Dockerfile 和 docker-compose.yml，方便在 Docker 环境中部署。

## 技术实现

- 使用 Express.js 构建 Web 服务器
- 使用 Socket.IO 与 Perplexity AI 的 WebSocket 服务通信
- 使用环境变量进行配置，包括 Perplexity 的 Cookie、User-Agent 和代理设置

## 使用方法

详细的使用说明请参考 [docker_use.md](docker_use.md) 和 [usage.md](usage.md) 文件。

基本步骤如下：

1. 克隆仓库
2. 设置必要的环境变量（PPLX_COOKIE, USER_AGENT, API_TOKEN）
3. 使用 Docker Compose 构建和运行服务
4. 通过 `http://localhost:8081/v1/chat/completions` 访问 API（具体的请自行实验）

## 注意事项

- 本服务仅支持流式响应。请在请求中将 `stream` 参数设置为 `true`。
- 确保您有有效的 Perplexity AI 账户和必要的认证信息。
- 使用时请遵守 Perplexity AI 的服务条款和使用政策。

## 免责声明

本项目仅供个人学习和研究使用。严禁用于商业用途或转售。使用本服务访问 Perplexity AI 时，请确保您遵守了相关的服务条款和使用政策。不提供任何技术支持，也不为任何违规使用导致的后果负责。
