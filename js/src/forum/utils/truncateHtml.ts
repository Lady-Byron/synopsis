/**
 * Safely truncate an HTML string without breaking opening/closing tags
 * Only characters in text nodes count towards the length
 *
 * [最终优化版]
 * - 截断文本节点。
 * - 删除长度用尽后的 *非图片* 元素 (如 <p>, <li>)。
 * - *保留* <img> 和 <picture> 元素，以便 Excerpt.tsx 能对它们计数。
 * - [性能优化] 添加 LRU 缓存，避免重复解析相同内容。
 *
 * @param html
 * @param maxLength
 */

// LRU 缓存：最多保留 100 条结果
const cache = new Map<string, string>();
const MAX_CACHE_SIZE = 100;

export default function (html: string, maxLength: number): string {
  // 生成缓存 key
  const cacheKey = `${maxLength}:${html}`;
  
  // 命中缓存直接返回
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    // 移到末尾（LRU 策略：最近使用的放最后）
    cache.delete(cacheKey);
    cache.set(cacheKey, cached);
    return cached;
  }

  const parser = new DOMParser().parseFromString(html, 'text/html');
  
  // [修复] 使用闭包变量而非修改参数
  let remaining = maxLength;

  const truncateNode = (node: Node) => {
    // 1. 如果长度已用完
    if (remaining <= 0) {
      // 1a. 保留非 emoji 的图片
      if (node.nodeName === 'IMG') {
        const img = node as HTMLImageElement;
        // emoji 图片应该随文字一起被截断，只保留内容图片
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

      // 1c. 如果它是其他元素 (如 <p>, <li>)，也删除它 (这修复了"长列表"Bug)
      //     但我们仍然需要递归检查它的 *子节点*，以防图片嵌套在 <p> 里
      if (node.childNodes.length > 0) {
        Array.from(node.childNodes).forEach(truncateNode);
      }
      
      // 如果这个节点现在是空的 (所有子节点都被清空了)，就删除它
      // (但要再次确认不是图片，以防万一)
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
        remaining = 0; // 长度用完
      }
      return;
    }

    // 3. 如果是其他元素 (且长度未用完)
    // 递归它的子节点
    Array.from(node.childNodes).forEach(truncateNode);
  };

  truncateNode(parser.body);

  const result = parser.body.innerHTML;
  
  // 存入缓存
  if (cache.size >= MAX_CACHE_SIZE) {
    // 删除最旧的（Map 迭代顺序是插入顺序）
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(cacheKey, result);

  return result;
}
