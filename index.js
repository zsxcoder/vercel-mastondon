require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const axios = require('axios');

// 设置环境变量
const Host = process.env.HOST || 'https://jiong.us/';
const UserId = process.env.USERID || '110710864910866001';
const Tittle = process.env.TITTLE || 'Retirement Memos';
const Description = process.env.DESCRIPTION || '愿爱无忧! peace & love !';

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 动态生成 HTML
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="referrer" content="no-referrer">
        <link rel="icon" href="/assets/img/logo.webp" type="image/*" />
        <link href="assets/css/style.css" rel="stylesheet" type="text/css">
        <link href="assets/css/APlayer.min.css" rel="stylesheet" type="text/css">
        <link href="assets/css/highlight.github.min.css" rel="stylesheet" type="text/css">
        <link href="assets/css/custom.css" rel="stylesheet" type="text/css">
        <link href="assets/css/link-card.css" rel="stylesheet" type="text/css">
        <title>${Tittle}</title>              
        <link rel="stylesheet" href="https://cdn.0tz.top/lxgw-wenkai-screen-webfont/style.css" /> 
        <style>body{font-family:"LXGW WenKai Screen",sans-serif;}</style>
    </head>
    <body>
        <header>
            <div class="menu">
                <div class="title">首页</div>
                <div class="pages">
                </div>
            </div>
            <div class='theme-toggle'>🌓</div>
        </header>
        <section id="main" class="container">
            <h1>${Tittle}</h1>
            <blockquote>
                <!--   <p>Je <del>memos</del>, donc je suis - <em>René Descartes fans</em></p> -->
                ${Description}
            </blockquote>
            <div id="memos" class="memos">
                <!-- Memos Container -->
            </div>
        </section><button id="backToTopBtn" title="Go to top">Top</button>
        <footer class="markdown-body footer">
            <p>Copyright @
                <script>
                    document.write(new Date().getFullYear())
                </script>
                 ${Tittle}  All Rights Reserved.
            </p>
        </footer>
        <script type="text/javascript" src="assets/js/view-image.min.js"></script>
        <script type="text/javascript" src="assets/js/APlayer.min.js"></script>
        <script type="text/javascript" src="assets/js/Meting.min.js"></script>
        <script type="text/javascript" src="assets/js/main.js"></script>
        <script type="text/javascript" src="assets/js/link-card.js"></script>
        <script type="text/javascript" src="assets/js/custom.js"></script>
    </body>
    </html>
    `;

    res.send(html);
});

// 代理网页卡片元数据
app.get('/api/link-preview', async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: '缺少URL参数' });
    }

    try {
        // 创建一个忽略SSL证书错误的axios实例
        const https = require('https');
        const axiosInstance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false // 忽略自签名证书错误
            }),
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // 发起请求获取网页内容
        const response = await axiosInstance.get(url);
        
        const html = response.data;
        
        // 提取元数据
        const title = matchMeta(html, ['og:title', 'title']) || getDomain(url);
        const description = matchMeta(html, ['og:description', 'description']) || '';
        const image = matchMeta(html, ['og:image', 'image']);
        const siteName = matchMeta(html, ['og:site_name']) || getDomain(url);
        
        res.json({
            title,
            description,
            image,
            siteName,
            url
        });
    } catch (error) {
        console.error(`获取链接预览失败 (${url}):`, error.message);
        // 降级处理：只返回基本信息
        res.json({
            title: getDomain(url),
            description: '点击访问网站',
            image: '',
            siteName: getDomain(url),
            url
        });
    }
});

// 辅助函数：匹配元数据
function matchMeta(html, names) {
    for (const name of names) {
        // 匹配不同的元数据格式
        const patterns = [
            new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
            new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
            new RegExp(`<title[^>]*>([^<]+)</title>`, 'i')
        ];
        
        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
    }
    return null;
}

// 辅助函数：从URL获取域名
function getDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return url;
    }
}

// 代理 /api/memos 路由
app.get('/api/memos', async (req, res) => {
    // 从环境变量读取
    const host = process.env.HOST.replace(/\/$/, '');
    const userId = process.env.USERID;
    const token = process.env.TOKEN; 

    // 组装参数
    const limit = req.query.limit || 10;
    const params = [
        'exclude_replies=true',
        'only_public=true'
    ];
    if (req.query.max_id) params.push(`max_id=${req.query.max_id}`);
    if (req.query.since_id) params.push(`since_id=${req.query.since_id}`);

    const url = `${host}/api/v1/accounts/${userId}/statuses?${params.join('&')}`;

    try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(url, {
            headers,
            timeout: 5000
        });
        // 透传 Link header（用于前端获取下一页）
        if (response.headers.link) {
            res.set('Link', response.headers.link);
        }
        res.json(response.data);
    } catch (err) {
        if (err.code === 'ECONNABORTED') {
            res.status(504).json({ error: '请求第三方API超时' });
        } else {
            res.status(500).json({ error: 'API 代理失败', detail: err.message });
        }
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
