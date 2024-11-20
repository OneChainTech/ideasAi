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
            model: 'gpt-4',
            messages: [
                {
                    role: 'user',
                    content: `请分析这张图片，并生成Mermaid格式的思维导图数据。请确保生成的数据符合Mermaid语法规范。图片地址：${imageUrl}`
                }
            ],
            max_tokens: 500,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const mermaidData = response.data.choices[0].message.content;
        res.json({ mermaidData });

    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).json({ error: '处理请求时出错' });
    }
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`服务器正在运行，访问地址: http://localhost:${PORT}`);
});