/**
 * Safely truncate an HTML string without breaking opening/closing tags
 * Only characters in text nodes count towards the length
 *
 * [最终优化版]
 * - 截断文本节点
 * - 限制图片数量（在解析阶段完成，避免 CLS）
 * - 返回原始图片总数供角标使用
 * - [性能优化] 添加 LRU 缓存
 *
 * @param html
 * @param maxLength
 * @param imageLimit
 */

export interface TruncateResult {
  html: string;
  totalImages: number;  // 原始图片总数（不含 emoji）
}

// LRU 缓存：最多保留 100 条结果
const cache = new Map<string, TruncateResult>();
const MAX_CACHE_SIZE = 100;

export default function (html: string, maxLength: number, imageLimit: number = 1): TruncateResult {
  // 生成缓存 key
  const cacheKey = `${maxLength}:${imageLimit}:${html}`;
  
  // 命中缓存直接返回
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    // 移到末尾（LRU 策略：最近使用的放最后）
    cache.delete(cacheKey);
    cache.set(cacheKey, cached);
    return cached;
  }

  const parser = new DOMParser().parseFromString(html, 'text/html');
  
  // 统计并限制图片
  const allImages = Array.from(parser.body.querySelectorAll('img')).filter(
    img => !img.classList.contains('emoji')
  );
  const totalImages = allImages.length;
  
  // 移除超出限制的图片
  allImages.forEach((img, i) => {
    if (i >= imageLimit) {
      img.remove();
    } else {
      // 为保留的图片设置懒加载属性
      const lazySrc = img.getAttribute('data-src') ||
                      img.getAttribute('data-original') ||
                      img.getAttribute('data-lazy') ||
                      img.getAttribute('data-url');
      if (!img.getAttribute('src') && lazySrc) {
        img.setAttribute('src', lazySrc);
      }
      img.loading = 'lazy';
      img.decoding = 'async';
    }
  });
  
  // 使用闭包变量
  let remaining = maxLength;

  const truncateNode = (node: Node) => {
    // 1. 如果长度已用完
    if (remaining <= 0) {
      // 1a. 保留非 emoji 的图片（已在上面处理过数量限制）
      if (node.nodeName === 'IMG') {
        const img = node as HTMLImageElement;
        if (img.classList.contains('emoji')) {
          node.parentNode?.removeChild(node);
        }
        return;
      }
      if (node.nodeName === 'PICTURE') {
        return;
      }
      
      // 1b. 如果它是文本节点，删除它
      if (node.nodeType === Node.TEXT_NODE) {
        node.parentNode?.removeChild(node);
        return;
      }

      // 1c. 如果它是其他元素，递归检查子节点后删除空节点
      if (node.childNodes.length > 0) {
        Array.from(node.childNodes).forEach(truncateNode);
      }
      
      if (node.childNodes.length === 0 && node.nodeName !== 'IMG' && node.nodeName !== 'PICTURE') {
         node.parentNode?.removeChild(node);
      }

      return;
    }

    // 2. 如果是文本节点 (且长度未用完)
    if (node.nodeType === Node.TEXT_NODE) {
      const textLen = node.textContent?.length ?? 0;
      if (textLen < remaining) {
        remaining -= textLen;
      } else {
        node.textContent = (node.textContent ?? '').substring(0, remaining) + '...';
        remaining = 0;
      }
      return;
    }

    // 3. 递归子节点
    Array.from(node.childNodes).forEach(truncateNode);
  };

  truncateNode(parser.body);
  
  // 清理空白节点
  const nodesToRemove: Node[] = [];
  parser.body.childNodes.forEach(node => {
    if (node.nodeType === 1) {
      const text = node.textContent?.trim() || '';
      if ((text === '' || text === '...') && !(node as HTMLElement).querySelector('img')) {
        nodesToRemove.push(node);
      }
    }
  });
  nodesToRemove.forEach(node => node.remove());

  const result: TruncateResult = {
    html: parser.body.innerHTML,
    totalImages
  };
  
  // 存入缓存
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(cacheKey, result);

  return result;
}
