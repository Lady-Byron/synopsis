/**
 * Safely truncate an HTML string without breaking opening/closing tags
 * Only characters in text nodes count towards the length
 *
 * [已修改] 此版本只删除超出长度的 *文本节点*，
 * 它会保留所有元素节点 (如 <img>)，以便 Excerpt.tsx 组件能正确处理它们。
 *
 * @param html
 * @param length
 */
export default function (html: string, length: number): string {
  const parser = new DOMParser().parseFromString(html, 'text/html');

  const truncateNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (length === 0) {
        // 长度已用完，删除这个多余的文本节点
        node.parentNode!.removeChild(node);
        return;
      }

      if (node.textContent!.length < length) {
        length -= node.textContent!.length;
      } else {
        node.textContent = node.textContent!.substring(0, length) + '...';
        length = 0; // 长度用完
      }
      return;
    }

    // [新逻辑]
    // 如果它是一个元素节点 (Element Node)，例如 <img>, <p>, <div>,
    // 我们 *永远不要* 删除它，因为我们不知道它是否是图片。
    // 我们只递归它的子节点。
    Array.from(node.childNodes).forEach(truncateNode);
  };

  truncateNode(parser.body);

  return parser.body.innerHTML;
}
