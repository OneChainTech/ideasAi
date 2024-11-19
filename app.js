const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
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
                    content: `请根据以下图片信息生成适合思维导图的数据结构：图片地址：${imageUrl}`
                }
            ],
            max_tokens: 500,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const mindmapData = response.data.choices[0].message.content;

    // 使用 Puppeteer 渲染思维导图
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.jsdelivr.net/npm/jsmind@latest"></script>
        </head>
        <body>
            <div id="jsmind_container"></div>
            <script>
                const options = {
                    container: 'jsmind_container',
                    theme: 'primary',
                    editable: false
                };
                const mindmapData = ${JSON.stringify(mindmapData)};
                const jm = new jsMind(options);
                jm.show(mindmapData);
            </script>
        </body>
        </html>
    `);

    // 等待思维导图渲染完成
    await page.waitForSelector('.jsmind-inner');

    // 截取思维导图的截图
    const mindmapFilePath = path.join(UPLOAD_FOLDER, `${req.file.filename}.png`);
    const element = await page.$('#jsmind_container');
    await element.screenshot({ path: mindmapFilePath });

    await browser.close();

    const downloadUrl = `https://ideasai.onrender.com/${UPLOAD_FOLDER}/${req.file.filename}.png`;
    res.json({ downloadUrl });

    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).json({ error: '处理请求时出错' });
    }
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`服务器正在运行，访问地址: http://localhost:${PORT}`);
});