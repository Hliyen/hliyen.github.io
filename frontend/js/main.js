// ==========================================
// API 呼叫與檔案上傳邏輯
// ==========================================
async function uploadFile() {
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];

    if (!file) {
        alert('請先選擇一個檔案！');
        return;
    }

    // 建立 FormData 物件來包裝檔案
    const formData = new FormData();
    formData.append('file', file);

    try {
        // 呼叫 Flask 後端的 /upload API
        const response = await fetch('http://127.0.0.1:5000/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert('檔案解析成功！');
            console.log("後端回傳的資料：", result.data);
            // 將後端回傳的資料丟給渲染函式
            renderTable(result.data);
        } else {
            alert(`錯誤: ${result.error}`);
        }
    } catch (error) {
        console.error('上傳失敗:', error);
        alert('無法連接到伺服器，請確認後端程式是否已啟動。');
    }
}


// ==========================================
// 動態表格渲染邏輯
// ==========================================
function renderTable(data) {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const markColumn = document.getElementById('markColumn');
    
    // 清空現有表格內容
    tableBody.innerHTML = ""; 

    if (!data || data.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='10'>沒有解析到任何題目資料</td></tr>";
        return;
    }

    // 1. 找出所有題目中「最多的選項數量」，動態擴充表頭
    let maxOptions = 0;
    data.forEach(item => {
        if (item.options && item.options.length > maxOptions) {
            maxOptions = item.options.length;
        }
    });

    // 清除舊的動態選項表頭 (只保留「正確答案」和「題目」)
    while (tableHeader.children.length > 2) {
        tableHeader.removeChild(tableHeader.lastChild);
    }

    // 插入新的選項表頭
    const numberToChinese = ["一", "二", "三", "四", "五", "六", "七", "八"];
    for (let i = 0; i < maxOptions; i++) {
        let th = document.createElement('th');
        th.textContent = `選項${numberToChinese[i] || (i+1)}`;
        tableHeader.appendChild(th);
    }
    
    // 將「標記」欄位加回表頭最後面
    tableHeader.appendChild(markColumn);

    // 2. 渲染每一列資料
    data.forEach(item => {
        let tr = document.createElement('tr');
        
        // 為了確保比較邏輯正確，將正確答案轉為字串並去除空白
        const correctAnswerStr = String(item.correct).trim();

        // 【修正點 1】欄位 1: 正確答案 (加上 ID，預設顯示為隱藏)
        tr.innerHTML += `<td id="ans_col_${item.id}" style="color: #aaa; font-style: italic;">🔒 隱藏</td>`;
        
        // 欄位 2: 題目
        tr.innerHTML += `<td class="question-text">${item.question}</td>`;
        
        // 欄位 3 ~ N: 動態選項區塊
        const optionLetters = ["A", "B", "C", "D", "E", "F", "G", "H"]; // 支援 A-H 選項判斷
        for (let i = 0; i < maxOptions; i++) {
            if (item.options && i < item.options.length) {
                // 【修正點 2】自動判斷正確答案的格式
                // 如果正確答案是英文字母 (如 PDF 的 A/B/C/D)，按鈕值就設為 A/B/C/D
                // 如果正確答案是數字 (如 Excel 的 1/2/3/4)，按鈕值就設為 1/2/3/4
                let optionValueToCheck = String(i + 1); 
                if (correctAnswerStr.match(/^[A-Za-z]$/)) {
                    optionValueToCheck = optionLetters[i]; 
                }

                // 渲染正常的選項按鈕
                tr.innerHTML += `
                    <td>
                        <button onclick="checkAnswer(this, '${optionValueToCheck}', '${correctAnswerStr}', '${item.id}')" style="width: 100%; text-align: left; padding: 5px; cursor: pointer;">
                            ${item.options[i]}
                        </button>
                    </td>`;
            } else {
                tr.innerHTML += `<td></td>`; 
            }
        }
        
        // 最後一個欄位: 標記 Checkbox
        tr.innerHTML += `<td><input type="checkbox" id="mark_${item.id}"></td>`;
        tableBody.appendChild(tr);
    });
}

// ==========================================
// 作答比對、標記與取消選取 (Toggle) 邏輯
// ==========================================
function checkAnswer(btnElement, selectedValue, correctValue, rowId) {
    const tr = btnElement.closest('tr'); // 取得目前按鈕所在的這一列 (row)
    const checkbox = document.getElementById(`mark_${rowId}`);
    const ansCell = document.getElementById(`ans_col_${rowId}`); 
    
    // 1. 切換按鈕自身的狀態與顏色
    if (btnElement.dataset.selected === "true") {
        // == 狀態：取消選取 ==
        btnElement.dataset.selected = "false";
        btnElement.dataset.isCorrect = ""; 
        btnElement.style.backgroundColor = ""; // 恢復預設背景
        btnElement.style.color = "";           // 恢復預設文字顏色
    } else {
        // == 狀態：進行選取 ==
        btnElement.dataset.selected = "true";
        
        // 將答案轉為大寫比對，避免大小寫差異
        if (selectedValue.toUpperCase() !== correctValue.toUpperCase()) {
            // 選錯
            btnElement.dataset.isCorrect = "false";
            btnElement.style.backgroundColor = "#ffcccc"; 
            btnElement.style.color = "#a00";
            
            // 【關鍵修改】：只要點錯，就強制將 Checkbox 打勾，且後續取消點擊時不自動移除
            checkbox.checked = true; 
        } else {
            // 選對
            btnElement.dataset.isCorrect = "true";
            btnElement.style.backgroundColor = "#ccffcc"; 
            btnElement.style.color = "#060";
        }
    }

    // 2. 重新計算這一列的正確答案顯示狀態
    const allSelectedBtns = tr.querySelectorAll('button[data-selected="true"]');
    let hasCorrectAnswer = false;

    // 檢查目前選取的按鈕中，有沒有對的
    allSelectedBtns.forEach(btn => {
        if (btn.dataset.isCorrect === "true") hasCorrectAnswer = true;
    });

    // 控制「正確答案」顯示：只要有選對的，就解鎖顯示；如果取消選對了，就鎖回去
    if (hasCorrectAnswer) {
        ansCell.innerHTML = `<span style="color: #060; font-weight: bold;">${correctValue}</span>`;
    } else {
        ansCell.innerHTML = `🔒 隱藏`;
        ansCell.style.color = "#aaa";
        ansCell.style.fontStyle = "italic";
    }
}