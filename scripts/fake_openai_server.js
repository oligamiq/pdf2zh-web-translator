const http = require('http');

// Provider A: Returns 429 on normal requests, and streams partial on /partial
const serverA = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.url.includes('/partial')) {
        res.writeHead(200, { 'Content-Type': 'text/event-stream' });
        res.write('data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":12345,"model":"llama3","choices":[{"delta":{"content":"Hello"},"index":0,"finish_reason":null}]}\n\n');
        setTimeout(() => {
            req.socket.destroy(new Error('Unexpected mid-stream crash'));
        }, 500);
    } else {
        res.writeHead(429, { 'Content-Type': 'text/plain' });
        res.end('Rate limit exceeded');
    }
});

// Provider B: Returns 200 OK stream
const serverB = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write('data: {"id":"chatcmpl-456","object":"chat.completion.chunk","created":12345,"model":"gpt-4o","choices":[{"delta":{"content":"Hello from Provider B"},"index":0,"finish_reason":null}]}\n\n');
    setTimeout(() => {
        res.write('data: {"id":"chatcmpl-456","object":"chat.completion.chunk","created":12345,"model":"gpt-4o","choices":[{"delta":{},"index":0,"finish_reason":"stop"}]}\n\n');
        res.write('data: [DONE]\n\n');
        res.end();
    }, 100);
});

serverA.listen(8001, () => console.log('Provider A listening on 8001'));
serverB.listen(8002, () => console.log('Provider B listening on 8002'));
