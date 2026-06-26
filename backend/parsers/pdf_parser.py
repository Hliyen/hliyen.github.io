# backend/parsers/pdf_parser.py (修復與優化版)
import os
import re
from pdf2image import convert_from_path
import pytesseract
from PIL import Image
import numpy as np
import cv2 # 需要 pip install opencv-python-headless

# 設定 Tesseract 路徑 (Windows 用戶可能需要)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_image(pil_image):
    """基本圖像預處理以提高 OCR 準確性"""
    # 轉為 numpy 陣列
    open_cv_image = np.array(pil_image)
    # RGB to BGR
    open_cv_image = open_cv_image[:, :, ::-1].copy()
    # 轉灰階
    gray = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2GRAY)
    # 自適應二值化 (處理陰影和對比度)
    # 可以將文字與背景完全分離成黑白，提高 OCR 對複雜背景的成功率
    threshold = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    # 轉回 PIL 圖片
    return Image.fromarray(threshold)

def parse_pdf_with_images(file_path):
    print(f"正在使用 OCR 解析包含圖片的 PDF: {file_path}")
    
    if not file_path.lower().endswith('.pdf'):
        raise Exception("此解析器僅支援 PDF 檔案。")

    # ==========================================
    # 在這裡加上 poppler_path 參數！
    # 請將 r"C:\poppler\bin" 替換成你實際解壓縮的 bin 資料夾路徑
    # ==========================================
    POPPLER_PATH = r"C:\poppler\Library\bin" 
    
    # 將路徑傳入 convert_from_path
    images = convert_from_path(file_path, poppler_path=POPPLER_PATH)
    
    extracted_text = ""
    # ... (後面的程式碼維持不變) ...

    # ... 前面的迴圈程式碼保持不變 ...
    for i, img in enumerate(images):
        print(f"解析第 {i+1} 頁圖片...")
        preprocessed_img = preprocess_image(img)
        text = pytesseract.image_to_string(preprocessed_img, lang='chi_tra+eng') 
        extracted_text += text + "\n--[PAGE_BREAK]--\n" 
        
    # ====== 請在這裡加入這三行 ======
    print("\n--- 以下是 OCR 辨識出的原始文字 ---")
    print(extracted_text)
    print("-----------------------------------\n")
    # ==============================
        
    print("OCR 完成，開始解析文字為 JSON...")
    # 呼叫更穩健的 Regex 解析函式
    return process_text_to_json_robust(extracted_text)

def process_text_to_json_robust(text):
    """更穩健的 Regex 解析邏輯，已修正 re.findall 擷取群組過多的問題"""
    questions_list = []
    
    # 1. 拆解為個別題目塊
    text_blocks = re.split(r'^(?=\d+[\.、]\s*)', text, flags=re.MULTILINE)
    
    id_counter = 1
    for block in text_blocks:
        block = block.strip()
        if not block:
            continue
            
        # 2. 從塊中提取題目文本 (修正後半段為非擷取)
        question_match = re.search(r'^(\d+[\.、]?)\s*(.*?)(?=^\s*[A-D][\.、]|\Z)', block, flags=re.MULTILINE | re.DOTALL)
        
        if question_match:
            question_id_raw = question_match.group(1) 
            question_text = question_match.group(2).strip()
            
            # 清理題目文字
            question_text = re.sub(r'\s+', ' ', question_text).strip()

            # 3. 從塊中提取選項 
            # 【已修正】移除了 (?= ) 內部多餘的小括號，確保 re.findall 只回傳 (opt_letter, opt_text) 2 個元素
            options = []
            option_matches = re.findall(r'^\s*([A-D])[\.、]\s*(.*?)(?=^\s*[A-D][\.、]|\Z)', block, flags=re.MULTILINE | re.DOTALL)
            
            for opt_letter, opt_text in option_matches:
                # 清理選項文字
                opt_text = re.sub(r'\s+', ' ', opt_text).strip()
                options.append(f"{opt_letter}. {opt_text}")

            # 4. 從塊中提取正確答案
            answer_match = re.search(r'Correct\s*Answer:?\s*([A-D])', block, flags=re.IGNORECASE)
            if not answer_match:
                answer_match = re.search(r'([A-D])\s*(?=\s*Correct\s*Answer)', block, flags=re.IGNORECASE)
            
            correct_answer = answer_match.group(1) if answer_match else ""

            # 只有當同時有題目和選項時才加入
            if question_text and options:
                questions_list.append({
                    "id": id_counter, 
                    "correct": correct_answer,
                    "question": question_text,
                    "options": options,
                    "is_multiple_choice": False 
                })
                id_counter += 1
                print(f"成功解析題目 {question_id_raw}")
        else:
            print(f"無法在塊中找到題目文本。內容長度：{len(block)}")

    if not questions_list:
        print("警告：解析完成，但未找到任何有效題目。")
    
    return questions_list