const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
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
            model: 'gpt-4', // 确保模型名称正确
            messages: [
                {
                    role: 'user',
                    content: `请根据以下图片信息生成Mermaid流程图语法：图片地址：${imageUrl}`
                }
            ],
            max_tokens: 500, // 根据需要调整
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        // 打印出从 OpenAI API 返回的响应
        console.log(response.data);
        
        // AI返回的数据转换为Mermaid格式
        const mermaidData = response.data.choices[0].message.content;

        // 将Mermaid数据写入临时文件
        const mermaidFilePath = path.join(UPLOAD_FOLDER, `${req.file.filename}.mmd`);
        fs.writeFileSync(mermaidFilePath, mermaidData, 'utf8');

        // 生成SVG文件的路径
        const svgFilePath = path.join(UPLOAD_FOLDER, `${req.file.filename}.svg`);

        // 使用 mermaid-cli 生成SVG
        exec(`npx mmdc -i ${mermaidFilePath} -o ${svgFilePath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`生成流程图时出错: ${error.message}`);
                return res.status(500).json({ error: '生成流程图时出错' });
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                // 根据需要决定是否将stderr视为错误
            }

            // 可选：删除临时的Mermaid文件
            fs.unlinkSync(mermaidFilePath);

            // 将文件路径发送给客户端，以便下载
            const downloadUrl = `https://ideasai.onrender.com/${UPLOAD_FOLDER}/${req.file.filename}.svg`;
            res.json({ downloadUrl });
        });

    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).json({ error: '处理请求时出错' });
    }
});

// 启动服务器
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`服务器正在运行，访问地址: http://localhost:${PORT}`);
});
