# ideasAi/app.py fastapi
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from openai import OpenAI
import os
import shutil

app = FastAPI()
client = OpenAI()

# 设置上传文件的存储路径
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 从环境变量中获取 OpenAI API 密钥
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key is None:
    raise ValueError("请设置环境变量 OPENAI_API_KEY")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # 保存文件
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 生成文件的线上地址 52.41.36.82 54.191.253.12 44.226.122.3
    image_url = f"http://52.41.36.82:8000/{UPLOAD_FOLDER}/{file.filename}"
    
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
    return JSONResponse(content={"image_url": image_url, "description": response.choices[0].message['content']})

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)