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

def parse_pdf_with_images(file_path):
    print(f"正在使用「節省記憶體模式」解析 PDF: {file_path}")
    
    # 1. 轉為圖片並逐頁處理 (使用低 DPI 節省資源)
    # 將 pdf_path 轉為圖片，dpi設為150，thread_count設為1以降低併發負擔
    images = convert_from_path(file_path, dpi=150, thread_count=1)
    
    extracted_text = ""
    for i, img in enumerate(images):
        print(f"解析第 {i+1} 頁...")
        # 預處理圖片
        preprocessed_img = preprocess_image(img)
        # OCR 辨識
        text = pytesseract.image_to_string(preprocessed_img, lang='chi_tra+eng')
        extracted_text += text + "\n--[PAGE_BREAK]--\n"
        
        # 關鍵：處理完刪除圖片引用，釋放記憶體
        del img
        del preprocessed_img
        
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
