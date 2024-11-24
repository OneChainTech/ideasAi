const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

const UPLOAD_FOLDER = 'uploads';
if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER);
}

app.get('/', (req, res) => {
    res.json({ message: '欢迎使用 Node.js!' });
});

app.use('/uploads', express.static('uploads'));

app.post('/upload', upload.single('file'), async (req, res) => {
    const filePath = path.join(UPLOAD_FOLDER, req.file.filename);
    const imageUrl = `https://ideasai.onrender.com/${UPLOAD_FOLDER}/${req.file.filename}`;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: "text", text: "请仔细分析提供的图片，准确提取其中的所有信息和结构。根据分析结果，仅返回符合Mermaid语法的流程图或思维导图代码。请确保代码组织良好，以便更好地将手稿渲染成Mermaid流程图或思维导图。不要包含任何其他文字说明。请使用代码块包裹Mermaid代码。" },
                        {
                            type: "image_url",
                            image_url: {
                                "url": imageUrl
                            },
                        }
                    ]
                }
            ],
            max_tokens: 500,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const analysisResult = response.data.choices[0].message.content;
        res.json({ analysisResult });

    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).json({ error: '处理请求时出错' });
    }
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`服务器正在运行，访问地址: http://localhost:${PORT}`);
});
