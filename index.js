const express = require("express");
const { io } = require("socket.io-client");
const { v4: uuidv4 } = require("uuid");
const { ProxyAgent } = require("proxy-agent");
const agent = new ProxyAgent();
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 8081;

var opts = {
	agent: agent,
	auth: {
		jwt: "anonymous-ask-user",
	},
	reconnection: false,
	transports: ["websocket"],
	path: "/socket.io",
	hostname: "www.perplexity.ai",
	secure: true,
	port: "443",
	extraHeaders: {
		Cookie: process.env.PPLX_COOKIE,
		"User-Agent": process.env.USER_AGENT,
		Accept: "*/*",
		priority: "u=1, i",
		Referer: "https://www.perplexity.ai/",
	},
};

// Add API token validation middleware
function validateApiToken(req, res, next) {
  const apiToken = req.headers['authorization'];
  if (!apiToken || !apiToken.startsWith('Bearer ') || apiToken.split(' ')[1] !== process.env.API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Use the validation middleware
app.use(validateApiToken);

// 添加更详细的日志记录
app.use((req, res, next) => {
	console.log(`Received ${req.method} request to ${req.url}`);
	next();
});

app.post("/v1/chat/completions", (req, res) => {
	console.log("Received request to /v1/chat/completions");
	req.rawBody = "";
	req.setEncoding("utf8");

	req.on("data", function (chunk) {
		req.rawBody += chunk;
	});

	req.on("end", async () => {
		try {
			let jsonBody = JSON.parse(req.rawBody);
			console.log("Parsed request body:", jsonBody);
			
			if (jsonBody.stream !== true) {
				// 处理非流式请求
				res.json({
					id: "chatcmpl-" + crypto.randomBytes(16).toString('hex'),
					object: "chat.completion",
					created: Math.floor(Date.now() / 1000),
					model: "claude-3-opus-20240229",
					choices: [
						{
							index: 0,
							message: {
								role: "assistant",
								content: "This API only supports streaming responses. Please set 'stream' to true in your request.",
							},
							finish_reason: "stop"
						}
					],
					usage: {
						prompt_tokens: 0,
						completion_tokens: 0,
						total_tokens: 0
					}
				});
			} else {
				// 处理流式请求
				res.setHeader("Content-Type", "text/event-stream");
				res.setHeader("Cache-Control", "no-cache");
				res.setHeader("Connection", "keep-alive");

				// 将OpenAI API格式的消息历史转换为Perplexity AI可以理解的格式
				let previousMessages = jsonBody.messages
					.map((msg) => msg.content)
					.join("\n\n");

				var socket = io("wss://www.perplexity.ai/", opts);

				socket.on("connect", function () {
					console.log(" > [Connected]");
					socket
						.emitWithAck("perplexity_ask", previousMessages, {
							"version": "2.9",
							"source": "default",
							"attachments": [],
							"language": "en-GB",
							"timezone": "Europe/London",
							"search_focus": "writing",
							"frontend_uuid": uuidv4(),
							"mode": "concise",
							"is_related_query": false,
							"is_default_related_query": false,
							"visitor_id": uuidv4(),
							"frontend_context_uuid": uuidv4(),
							"prompt_source": "user",
							"query_source": "home"
						})
						.then((response) => {
							console.log(response);
							sendFinalChunk(res);
						}).catch((error) => {
							if(error.message != "socket has been disconnected"){
								console.log(error);
							}
							sendFinalChunk(res);
						});
				});

				socket.on("query_progress", (data) => {
					if(data.text){
						var text = JSON.parse(data.text)
						var chunk = text.chunks[text.chunks.length - 1];
						if(chunk){
							sendChunk(res, chunk);
						}
					}
				});

				socket.on("disconnect", function () {
					console.log(" > [Disconnected]");
					sendFinalChunk(res);
				});

				socket.on("error", (error) => {
					console.log(error);
					sendErrorChunk(res, "Error occurred while fetching output. Please refer to the log for more information.");
					sendFinalChunk(res);
				});

				socket.on("connect_error", function (error) {
					console.log(error);
					sendErrorChunk(res, "Failed to connect to Perplexity.ai. Please refer to the log for more information.");
					sendFinalChunk(res);
				});

				res.on("close", function () {
					console.log(" > [Client closed]");
					socket.disconnect();
				});
			}
		} catch (e) {
			console.error("Error processing request:", e);
			res.status(400).json({ error: e.message });
		}
	});
});

function sendChunk(res, content) {
	const chunk = {
		id: "chatcmpl-" + crypto.randomBytes(16).toString('hex'),
		object: "chat.completion.chunk",
		created: Math.floor(Date.now() / 1000),
		model: "claude-3-opus-20240229",
		choices: [{
			index: 0,
			delta: {
				content: content
			},
			finish_reason: null
		}]
	};
	res.write(`data: ${JSON.stringify(chunk)}\n\n`);
}

function sendErrorChunk(res, errorMessage) {
	const chunk = {
		id: "chatcmpl-" + crypto.randomBytes(16).toString('hex'),
		object: "chat.completion.chunk",
		created: Math.floor(Date.now() / 1000),
		model: "claude-3-opus-20240229",
		choices: [{
			index: 0,
			delta: {
				content: errorMessage
			},
			finish_reason: "stop"
		}]
	};
	res.write(`data: ${JSON.stringify(chunk)}\n\n`);
}

function sendFinalChunk(res) {
	const finalChunk = {
		id: "chatcmpl-" + crypto.randomBytes(16).toString('hex'),
		object: "chat.completion.chunk",
		created: Math.floor(Date.now() / 1000),
		model: "claude-3-opus-20240229",
		choices: [{
			index: 0,
			delta: {},
			finish_reason: "stop"
		}]
	};
	res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
	res.write("data: [DONE]\n\n");
	res.end();
}

// 修改404处理
app.use((req, res, next) => {
	console.log(`404 Not Found: ${req.method} ${req.url}`);
	res.status(404).json({ error: "Not Found" });
});

// 添加全局错误处理
app.use((err, req, res, next) => {
	console.error("Unhandled error:", err);
	res.status(500).json({ error: "Internal Server Error" });
});

// handle other
app.use((req, res, next) => {
	res.status(404).send("Not Found");
});

app.listen(port, () => {
	console.log(`Perplexity proxy listening on port ${port}`);
});
// eventStream util
function createEvent(event, data) {
	// if data is object, stringify it
	if (typeof data === "object") {
		data = JSON.stringify(data);
	}
	return `event: ${event}\ndata: ${data}\n\n`;
}