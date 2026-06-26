import os
import re
from pdf2image import convert_from_path
import pytesseract
from PIL import Image
import numpy as np
import cv2 

def preprocess_image(pil_image):
    """基本圖像預處理"""
    open_cv_image = np.array(pil_image)
    open_cv_image = open_cv_image[:, :, ::-1].copy()
    gray = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2GRAY)
    threshold = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    return Image.fromarray(threshold)

from pdf2image import convert_from_path
# 新增導入，這能讓我們逐頁載入而不一次吃掉整份檔案
from pdf2image.exceptions import PDFPageCountError

def parse_pdf_with_images(file_path):
    print(f"正在啟動「極致省記憶體」模式解析 PDF: {file_path}")
    
    extracted_text = ""
    
    # 使用 pages_from_path 逐頁生成器，這不會一次轉完整個 PDF
    # 注意：這裡我們先不轉成 PIL 圖片，而是控制單頁轉檔
    try:
        # 獲取頁數，只處理一頁，處理完就釋放
        from pdf2image import pdfinfo_from_path
        info = pdfinfo_from_path(file_path)
        total_pages = info["Pages"]
        
        for i in range(1, total_pages + 1):
            print(f"正在處理第 {i} 頁，共 {total_pages} 頁...")
            
            # 關鍵：每次只轉一頁，並強制轉出 100 DPI (極低畫質換取成功率)
            # 如果還是不行，我們可能得考慮把 DPI 降到 72
            img_list = convert_from_path(file_path, dpi=100, first_page=i, last_page=i)
            
            if img_list:
                img = img_list[0]
                preprocessed_img = preprocess_image(img)
                text = pytesseract.image_to_string(preprocessed_img, lang='chi_tra+eng')
                extracted_text += text + "\n--[PAGE_BREAK]--\n"
                
                # 徹底清理記憶體
                del img
                del img_list
                del preprocessed_img
                
    except Exception as e:
        print(f"解析發生錯誤: {e}")
        return []

    print("OCR 完成，開始解析文字為 JSON...")
    return process_text_to_json_robust(extracted_text)

def process_text_to_json_robust(text):
    """(此部分邏輯不變，確保原有解析能力)"""
    questions_list = []
    text_blocks = re.split(r'^(?=\d+[\.、]\s*)', text, flags=re.MULTILINE)
    
    id_counter = 1
    for block in text_blocks:
        block = block.strip()
        if not block: continue
            
        question_match = re.search(r'^(\d+[\.、]?)\s*(.*?)(?=^\s*[A-D][\.、]|\Z)', block, flags=re.MULTILINE | re.DOTALL)
        
        if question_match:
            question_text = re.sub(r'\s+', ' ', question_match.group(2)).strip()
            
            options = []
            option_matches = re.findall(r'^\s*([A-D])[\.、]\s*(.*?)(?=^\s*[A-D][\.、]|\Z)', block, flags=re.MULTILINE | re.DOTALL)
            
            for opt_letter, opt_text in option_matches:
                opt_text = re.sub(r'\s+', ' ', opt_text).strip()
                options.append(f"{opt_letter}. {opt_text}")

            answer_match = re.search(r'Correct\s*Answer:?\s*([A-D])', block, flags=re.IGNORECASE)
            correct_answer = answer_match.group(1) if answer_match else ""

            if question_text and options:
                questions_list.append({
                    "id": id_counter, 
                    "correct": correct_answer,
                    "question": question_text,
                    "options": options,
                    "is_multiple_choice": False 
                })
                id_counter += 1
    
    return questions_list
