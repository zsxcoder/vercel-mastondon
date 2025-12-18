// 链接卡片生成和管理
(function() {
    // 缓存已获取的链接预览数据
    const linkPreviewCache = {};
    
    // 从内容中提取URL并转换为卡片
    function processLinkCards(content) {
        // 正则表达式匹配URL
        const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
        
        // 替换URL为卡片HTML
        return content.replace(urlRegex, (url) => {
            // 检查是否是图片链接，如果是则不处理为卡片
            if (isImageUrl(url)) {
                return url;
            }
            
            // 创建一个唯一的ID
            const cardId = 'link-card-' + Math.random().toString(36).substr(2, 9);
            
            // 立即显示加载状态的卡片
            setTimeout(() => {
                const container = document.getElementById(cardId);
                if (container) {
                    // 加载预览数据
                    fetchLinkPreview(url, cardId);
                }
            }, 100);
            
            // 返回卡片容器HTML
            return `<div id="${cardId}" class="link-card-container" data-url="${url}"></div>`;
        });
    }
    
    // 检查URL是否是图片
    function isImageUrl(url) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
        const lowerUrl = url.toLowerCase();
        return imageExtensions.some(ext => lowerUrl.includes(ext));
    }
    
    // 获取链接预览数据
    async function fetchLinkPreview(url, containerId) {
        // 检查缓存
        if (linkPreviewCache[url]) {
            renderLinkCard(linkPreviewCache[url], containerId);
            return;
        }
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 显示加载状态
        container.innerHTML = createLoadingCard(url);
        
        // 添加超时控制
        const timeoutId = setTimeout(() => {
            renderFallbackCard(url, containerId);
            console.warn(`链接预览超时: ${url}`);
        }, 8000); // 8秒超时
        
        try {
            const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 缓存结果
            linkPreviewCache[url] = data;
            
            // 渲染卡片
            renderLinkCard(data, containerId);
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('获取链接预览失败:', error);
            // 渲染降级卡片
            renderFallbackCard(url, containerId);
        }
    }
    
    // 创建加载状态的卡片
    function createLoadingCard(url) {
        return `
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-card loading">
                <div class="link-card-info">
                    <div class="link-card-title">加载中...</div>
                    <div class="link-card-description">正在获取网页信息</div>
                </div>
                <div class="link-card-icon"></div>
            </a>
        `;
    }
    
    // 渲染链接卡片
    function renderLinkCard(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let domain = '';
        try {
            domain = new URL(data.url).hostname;
        } catch (e) {
            // 如果URL解析失败，使用整个URL作为域名
            domain = data.url.length > 20 ? data.url.substring(0, 20) + '...' : data.url;
        }
        
        const title = data.title || domain;
        const description = data.description || `访问 ${domain}`;
        
        // 处理图片，如果图片URL是相对路径，转换为绝对路径
        let imageUrl = data.image;
        if (imageUrl && !imageUrl.startsWith('http')) {
            try {
                const baseUrl = new URL(data.url);
                imageUrl = new URL(imageUrl, baseUrl.origin).href;
            } catch (e) {
                imageUrl = '';
            }
        }
        
        const imageHtml = imageUrl 
            ? `<img src="${imageUrl}" alt="${title}" class="link-card-icon" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="link-card-icon" style="background-color: rgba(128, 128, 128, 0.1); display: none; align-items: center; justify-content: center; color: rgba(128, 128, 128, 0.5); font-size: 0.8rem;">${domain}</div>`
            : `<div class="link-card-icon" style="background-color: rgba(128, 128, 128, 0.1); display: flex; align-items: center; justify-content: center; color: rgba(128, 128, 128, 0.5); font-size: 0.8rem;">🔗</div>`;
        
        container.innerHTML = `
            <a href="${data.url}" target="_blank" rel="noopener noreferrer" class="link-card">
                <div class="link-card-info">
                    <div class="link-card-title">${title}</div>
                    <div class="link-card-description">${description}</div>
                </div>
                ${imageHtml}
            </a>
        `;
    }
    
    // 渲染降级卡片
    function renderFallbackCard(url, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const domain = new URL(url).hostname;
        
        container.innerHTML = `
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-card">
                <div class="link-card-info">
                    <div class="link-card-title">${domain}</div>
                    <div class="link-card-description">点击访问网站</div>
                </div>
                <div class="link-card-icon" style="background-color: rgba(128, 128, 128, 0.1); display: flex; align-items: center; justify-content: center; color: rgba(128, 128, 128, 0.5); font-size: 0.8rem;">🔗</div>
            </a>
        `;
    }
    
    // 导出函数供外部使用
    window.processLinkCards = processLinkCards;
})();