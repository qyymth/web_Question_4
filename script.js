(function() {
    // ---------- 配置 ----------
    const GRID_SIZE = 20;        // 20x20 网格，总格子数400
    let gridColors = new Array(GRID_SIZE * GRID_SIZE).fill('#ffffff');
    
    // 获取DOM元素
    const gridContainer = document.getElementById('pixelGrid');
    const colorPicker = document.getElementById('colorPicker');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');
    const exportCanvas = document.getElementById('exportCanvas');
    
    // 当前激活的画笔颜色
    let currentColor = colorPicker.value;
    
    // 更新全局画笔颜色
    function updateCurrentColor() {
        currentColor = colorPicker.value;
    }
    
    // 监听colorPicker变化
    colorPicker.addEventListener('input', function(e) {
        currentColor = e.target.value;
    });
    
    // ---------- 辅助函数: 索引 <-> 行列 ----------
    function getIndex(row, col) {
        return row * GRID_SIZE + col;
    }
    
    // 重新渲染整个网格 (根据gridColors)
    function renderFullGrid() {
        const pixels = document.querySelectorAll('.pixel');
        for (let i = 0; i < pixels.length; i++) {
            pixels[i].style.backgroundColor = gridColors[i];
        }
    }
    
    // 更新单个格子UI
    function updatePixelUI(index, color) {
        const pixelDiv = document.querySelector(`.pixel[data-index='${index}']`);
        if (pixelDiv) {
            pixelDiv.style.backgroundColor = color;
        }
    }
    
    // 设置某个格子的颜色 (内部更新存储和UI)
    function setPixelColor(index, color) {
        if (index < 0 || index >= gridColors.length) return;
        if (gridColors[index] === color) return;
        gridColors[index] = color;
        updatePixelUI(index, color);
    }
    
    // 清空画板 (全部重置为白色 #ffffff)
    function clearBoard() {
        for (let i = 0; i < gridColors.length; i++) {
            gridColors[i] = '#ffffff';
        }
        renderFullGrid();
    }
    
    // ---------- 初始化网格DOM元素，绑定事件 (事件委托 + 拖拽绘画) ----------
    function buildGrid() {
        gridContainer.innerHTML = '';
        // 创建所有像素格子
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            pixel.setAttribute('data-index', i);
            pixel.style.backgroundColor = gridColors[i];
            gridContainer.appendChild(pixel);
        }
        
        // 事件委托监听点击
        gridContainer.addEventListener('click', (e) => {
            let target = e.target;
            while (target && target !== gridContainer && !target.classList?.contains('pixel')) {
                target = target.parentElement;
            }
            if (target && target.classList && target.classList.contains('pixel')) {
                const indexAttr = target.getAttribute('data-index');
                if (indexAttr !== null) {
                    const idx = parseInt(indexAttr, 10);
                    if (!isNaN(idx)) {
                        setPixelColor(idx, currentColor);
                    }
                }
            }
        });
        
        // 拖拽绘画功能
        let isDrawing = false;
        
        function getPixelFromEvent(event) {
            let clientX, clientY;
            if (event.touches) {
                if (event.touches.length === 0) return null;
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else {
                clientX = event.clientX;
                clientY = event.clientY;
            }
            const elem = document.elementFromPoint(clientX, clientY);
            if (elem && elem.classList && elem.classList.contains('pixel')) {
                return elem;
            }
            return null;
        }
        
        function handleDraw(event) {
            if (!isDrawing) return;
            event.preventDefault();
            const pixelElem = getPixelFromEvent(event);
            if (pixelElem) {
                const idx = parseInt(pixelElem.getAttribute('data-index'), 10);
                if (!isNaN(idx) && gridColors[idx] !== currentColor) {
                    setPixelColor(idx, currentColor);
                }
            }
        }
        
        function startDraw(event) {
            isDrawing = true;
            const pixelElem = getPixelFromEvent(event);
            if (pixelElem) {
                const idx = parseInt(pixelElem.getAttribute('data-index'), 10);
                if (!isNaN(idx) && gridColors[idx] !== currentColor) {
                    setPixelColor(idx, currentColor);
                }
            }
            if (event.cancelable) event.preventDefault();
        }
        
        function endDraw() {
            isDrawing = false;
        }
        
        // 鼠标事件
        gridContainer.addEventListener('mousedown', startDraw);
        window.addEventListener('mouseup', endDraw);
        gridContainer.addEventListener('mousemove', handleDraw);
        
        // 触摸事件 (移动端)
        gridContainer.addEventListener('touchstart', startDraw, { passive: false });
        window.addEventListener('touchend', endDraw);
        gridContainer.addEventListener('touchmove', handleDraw, { passive: false });
    }
    
    // ---------- 保存为PNG图片 (基于界面实际渲染) ----------
    function saveAsPNG() {
        const firstPixel = document.querySelector('.pixel');
        if (!firstPixel) {
            alert("画板未准备好，请稍后");
            return;
        }
        
        const containerRect = gridContainer.getBoundingClientRect();
        const totalWidth = containerRect.width;
        const totalHeight = containerRect.height;
        
        exportCanvas.width = totalWidth;
        exportCanvas.height = totalHeight;
        
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) {
            alert("无法创建canvas上下文");
            return;
        }
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalWidth, totalHeight);
        
        const pixels = document.querySelectorAll('.pixel');
        for (let i = 0; i < pixels.length; i++) {
            const pixel = pixels[i];
            const pixelRect = pixel.getBoundingClientRect();
            const offsetX = pixelRect.left - containerRect.left;
            const offsetY = pixelRect.top - containerRect.top;
            const w = pixelRect.width;
            const h = pixelRect.height;
            const bgColor = window.getComputedStyle(pixel).backgroundColor;
            ctx.fillStyle = bgColor;
            ctx.fillRect(offsetX, offsetY, w, h);
        }
        
        try {
            const dataURL = exportCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
            link.download = `pixel_art_${timestamp}.png`;
            link.href = dataURL;
            link.click();
        } catch(err) {
            console.error("导出错误", err);
            alert("生成图片失败，可重试。");
        }
    }
    
    // 备用导出方案：基于颜色矩阵
    function exportFromColorMatrix() {
        const firstPixel = document.querySelector('.pixel');
        let cellSize = 28;
        if (firstPixel) {
            const rect = firstPixel.getBoundingClientRect();
            if (rect.width > 0) cellSize = rect.width;
        }
        const canvasWidth = GRID_SIZE * cellSize;
        const canvasHeight = GRID_SIZE * cellSize;
        exportCanvas.width = canvasWidth;
        exportCanvas.height = canvasHeight;
        const ctx = exportCanvas.getContext('2d');
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const idx = row * GRID_SIZE + col;
                const color = gridColors[idx];
                ctx.fillStyle = color;
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
        
        const dataURL = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
        link.download = `pixel_art_${timestamp}.png`;
        link.href = dataURL;
        link.click();
    }
    
    function handleSave() {
        try {
            saveAsPNG();
        } catch (error) {
            console.warn("界面导出失败，使用备用导出方案", error);
            exportFromColorMatrix();
        }
    }
    
    function handleClear() {
        clearBoard();
    }
    
    // 初始化
    function init() {
        buildGrid();
        clearBtn.addEventListener('click', handleClear);
        saveBtn.addEventListener('click', handleSave);
        updateCurrentColor();
    }
    
    init();
})();
