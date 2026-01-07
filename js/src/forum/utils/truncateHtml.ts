/**
 * Safely truncate an HTML string without breaking opening/closing tags
 * Only characters in text nodes count towards the length
 *
 * [最终优化版]
 * - 截断文本节点。
 * - 删除长度用尽后的 *非图片* 元素 (如 <p>, <li>)。
 * - *保留* <img> 和 <picture> 元素，以便 Excerpt.tsx 能对它们计数。
 *
 * @param html
 * @param length
 */
export default function (html: string, maxLength: number): string {
  const parser = new DOMParser().parseFromString(html, 'text/html');
  
  // [修复] 使用闭包变量而非修改参数
  let remaining = maxLength;

  const truncateNode = (node: Node) => {
    // 1. 如果长度已用完
    if (remaining <= 0) {
      // 1a. 但如果它是图片或图片容器，我们必须保留它
      if (node.nodeName === 'IMG' || node.nodeName === 'PICTURE') {
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

  return parser.body.innerHTML;
}
