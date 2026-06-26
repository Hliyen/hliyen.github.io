import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# 假設你已經將剛剛討論的解析邏輯放在 parsers 資料夾中
# 這裡先 import 進來備用 (若尚未實作可以先註解掉，或寫簡單的假資料回傳)
from parsers.excel_parser import parse_excel_csv
from parsers.pdf_parser import parse_pdf_with_images

app = Flask(__name__)
CORS(app) # 允許跨網域請求，讓前端可以順利呼叫 API

# 設定上傳檔案的儲存路徑
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 允許的副檔名
ALLOWED_EXTENSIONS = {'pdf', 'csv', 'xlsx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    # 檢查請求中是否包含檔案
    if 'file' not in request.files:
        return jsonify({"error": "沒有上傳檔案"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "未選擇檔案"}), 400
        
    if file and allowed_file(file.filename):
        # 確保檔名安全並儲存檔案
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # 根據副檔名呼叫對應的解析器
            ext = filename.rsplit('.', 1)[1].lower()
            parsed_data = []
            
            if ext in ['csv', 'xlsx']:
                # 呼叫 Excel/CSV 解析模組
                parsed_data = parse_excel_csv(filepath)
            elif ext == 'pdf':
                # 呼叫 PDF 解析模組
                parsed_data = parse_pdf_with_images(filepath)
                
            # 解析完成後可以選擇刪除暫存檔 (視需求而定)
            # os.remove(filepath)
            
            return jsonify({
                "message": "解析成功", 
                "data": parsed_data
            }), 200
            
        except Exception as e:
            return jsonify({"error": f"檔案解析失敗: {str(e)}"}), 500
            
    return jsonify({"error": "不支援的檔案格式"}), 400

if __name__ == '__main__':
    # 啟動開發伺服器，預設運行在 http://127.0.0.1:5000
    app.run(debug=True, port=5000)