# ideasAi/app.py
from flask import Flask, request, jsonify
from openai import OpenAI
import os

app = Flask(__name__)
client = OpenAI()

# 设置上传文件的存储路径
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 确保上传文件夹存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_file():
    # 检查请求中是否有文件
    if 'file' not in request.files:
        return jsonify({"error": "没有文件上传"}), 400
    
    file = request.files['file']
    
    # 保存文件
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)
    
    # 生成文件的线上地址（假设我们有一个静态文件服务器）
    image_url = f"http://yourdomain.com/{UPLOAD_FOLDER}/{file.filename}"
    
    # 调用 OpenAI 接口识别图片
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What's in this image?"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url,
                        }
                    },
                ],
            }
        ],
        max_tokens=300,
    )
    
    # 返回识别结果
    return jsonify({"image_url": image_url, "description": response.choices[0].message['content']})

if __name__ == '__main__':
    app.run(debug=True)