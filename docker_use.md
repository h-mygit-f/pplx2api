# 使用Docker部署Perplexity AI代理服务

本教程将指导您如何使用Docker来部署Perplexity AI代理服务。

## 前提条件

1. 安装Docker和Docker Compose
   - 对于Windows和Mac用户,安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - 对于Linux用户,按照[官方文档](https://docs.docker.com/engine/install/)安装Docker和Docker Compose

2. 获取Perplexity AI的Cookie和User-Agent
   - 按照 `usage.md` 中的说明获取这些信息

## 部署步骤

1. 克隆或下载项目代码到本地

2. 在项目根目录创建一个 `.env` 文件,内容如下:

   ```
   PPLX_COOKIE=your_perplexity_cookie_here
   USER_AGENT=your_user_agent_here
   API_TOKEN=your_api_token_here
   all_proxy=your_proxy_here  # 如果需要使用代理,否则可以省略
   ```

   将 `your_perplexity_cookie_here`, `your_user_agent_here`, 和 `your_api_token_here` 替换为您的实际值。

   对于 `all_proxy`，您可以使用以下格式之一：
   - HTTP 代理：`http://host:port`
   - HTTPS 代理：`https://host:port`
   - SOCKS4 代理：`socks4://host:port`
   - SOCKS5 代理：`socks5://host:port`

   例如：`all_proxy=http://192.168.3.13:39999`

3. 打开终端,进入项目根目录

4. 构建Docker镜像:

   ```
   docker-compose build
   ```

5. 启动服务:

   ```
   docker-compose up -d
   ```

6. 服务现在应该在后台运行。您可以通过以下命令查看日志:

   ```
   docker-compose logs -f
   ```

7. 要停止服务,运行:

   ```
   docker-compose down
   ```

## 使用服务

服务启动后,它将在 `http://localhost:8081` 上运行。您可以按照 `usage.md` 中的说明配置您的客户端使用这个地址。

## 故障排除

1. 如果遇到权限问题,尝试在命令前加上 `sudo`

2. 确保端口8081没有被其他服务占用

3. 如果服务无法连接到Perplexity AI,检查您的Cookie是否有效,以及是否需要配置代理

4. 如果使用代理，确保代理地址格式正确且代理服务器可用

5. 查看Docker日志以获取更多错误信息:
   ```
   docker-compose logs
   ```

如果仍然遇到问题,请查看项目的issue页面或创建新的issue寻求帮助。
