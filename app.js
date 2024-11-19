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

// 静态文件服务
app.use('/uploads', express.static('uploads'));


// 上传文件的路由
app.post('/upload', upload.single('file'), async (req, res) => {
    const filePath = path.join(UPLOAD_FOLDER, req.file.filename);
    
    // 生成文件的线上地址，读取用户上传的文件
    const imageUrl = `https://ideasai.onrender.com/${UPLOAD_FOLDER}/${req.file.filename}`; // 修改为动态地址
    
    // 调用 OpenAI 接口识别图片
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: "识别图片信息 根据图片信息生成Mermaid可以使用的数据结构" },
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

        // AI返回的数据转换为Mermaid格式
        const mermaidData = convertToMermaid(response.data.choices[0].message.content);

        // 使用mermaidAPI生成SVG
        mermaidAPI.initialize({ startOnLoad: true });
        mermaidAPI.render('mermaid', mermaidData, (svgCode) => {
            // 将SVG代码保存为文件
            const svgFilePath = path.join(UPLOAD_FOLDER, 'flowchart.svg');
            fs.writeFileSync(svgFilePath, svgCode);

            // 将文件路径发送给客户端，以便下载
            res.json({ downloadUrl: `https://ideasai.onrender.com/${UPLOAD_FOLDER}/flowchart.svg` });
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