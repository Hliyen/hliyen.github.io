# 1. 使用輕量版的 Python 3.9 作為基礎環境
FROM python:3.9-slim

# 2. 設定工作目錄
WORKDIR /app

# 3. 安裝系統依賴 (Poppler, Tesseract 繁中/英文包, OpenCV 需要的底層套件)
RUN apt-get update && apt-get install -y \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-chi-tra \
    tesseract-ocr-eng \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 4. 複製 requirements.txt 並安裝 Python 套件
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 把目前資料夾的所有程式碼複製到雲端伺服器裡
COPY . .

# 6. 建立暫存檔案的 uploads 資料夾
RUN mkdir -p uploads

# 7. 啟動伺服器 (Render 會自動提供 $PORT 環境變數)
CMD gunicorn app:app -b 0.0.0.0:$PORT