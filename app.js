const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// 设置上传文件的存储路径
const UPLOAD_FOLDER = 'uploads';
if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER);
}

// 根路径
app.get('/', (req, res) => {
    res.json({ message: '欢迎使用 Node.js!' });
});

// 上传文件的路由
app.post('/upload', upload.single('file'), async (req, res) => {
    const filePath = path.join(UPLOAD_FOLDER, req.file.filename);
    
    // 生成文件的线上地址，已写死为指定的图片地址
    const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"; // 修改为固定地址
    
    // 调用 OpenAI 接口识别图片
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: "What's in this image?" },
                        {
                            type: 'image_url',
                            image_url: { url: imageUrl },
                        },
                    ],
                },
            ],
            max_tokens: 300,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        // 返回识别结果
        res.json({
            image_url: imageUrl,
            description: response.data.choices[0].message.content,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '处理请求时出错' });
    }
});

// 启动服务器
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`服务器正在运行，访问地址: http://localhost:${PORT}`);
}); 