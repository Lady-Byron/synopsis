import Component, { ComponentAttrs } from 'flarum/common/Component';
import app from 'flarum/forum/app';
import Post from 'flarum/common/models/Post';
import { truncate } from 'flarum/common/utils/string';
import type Mithril from 'mithril';
import truncateHtml from '../utils/truncateHtml';

export interface ExcerptAttrs extends ComponentAttrs {
  post: Post;
  length: number;
  richExcerpt: boolean;
}

export default class Excerpt extends Component<ExcerptAttrs> {
  post!: Post;
  length!: number;
  richExcerpt!: boolean;

  oninit(vnode: Mithril.Vnode<ExcerptAttrs, this>) {
    super.oninit(vnode);

    this.post = this.attrs.post;
    this.length = this.attrs.length;
    this.richExcerpt = this.attrs.richExcerpt;
  }

  view() {
    // [新] 添加 oncreate/onupdate 钩子来处理 DOM
    // 并使用 'visibility' 来防止图片在处理完之前闪烁
    return (
      <div
        className="Synopsis-excerpt"
        style={{ visibility: 'hidden' }}
        oncreate={this.processExcerptDOM.bind(this)}
        onupdate={this.processExcerptDOM.bind(this)}
      >
        {this.getContent()}
      </div>
    );
  }

  getContent(): Mithril.Vnode | string {
    if (this.richExcerpt) {
      // truncateHtml 负责截断 *文字*
      // (我们假设此文件已恢复为插件原始版本)
      const html = this.contentRich() ?? '';
      return m.trust(truncateHtml(html, this.length));
    }

    return truncate(this.contentPlain() ?? '', this.length);
  }

  contentRich() {
    return this.post.contentHtml();
  }

  contentPlain() {
    return this.post.contentPlain();
  }

  // --- [新] 从页脚脚本移植的逻辑 ---

  /**
   * 确保懒加载图片有 src
   */
  ensureSrc(img: HTMLImageElement) {
    const cand =
      img.getAttribute('data-src') ||
      img.getAttribute('data-original') ||
      img.getAttribute('data-lazy') ||
      img.getAttribute('data-url');
    if (!img.getAttribute('src') && cand) img.setAttribute('src', cand);

    const pic = img.parentElement?.tagName?.toLowerCase() === 'picture' ? img.parentElement : null;
    if (pic) {
      pic.querySelectorAll('source').forEach((s) => {
        const ss = s.getAttribute('data-srcset');
        if (ss && !s.getAttribute('srcset')) s.setAttribute('srcset', ss);
      });
    }
  }

  /**
   * Mithril 钩子，在 DOM 渲染后运行
   * 负责截断图片、清理空白节点，并添加 +N 角标
   */
  processExcerptDOM(vnode: Mithril.VnodeDOM<ExcerptAttrs, this>) {
    const dom = vnode.dom as HTMLElement;

    // 如果不是富文本，则跳过
    if (!this.richExcerpt) {
      dom.style.visibility = 'visible';
      return;
    }
    
    // [修复] 使用 post id 检测内容是否变化，而非仅检查是否已处理
    const currentPostId = this.post?.id?.() ?? '';
    const processedPostId = dom.dataset.synopsisPostId;
    
    if (dom.dataset.synopsisClamped === '1' && processedPostId === currentPostId) {
      dom.style.visibility = 'visible';
      return;
    }
    
    // 如果 post 变化了，需要重置状态（虽然通常 Mithril 会重建 DOM）
    if (processedPostId && processedPostId !== currentPostId) {
      // 清除之前的角标
      const oldBadge = dom.querySelector('.synopsis-extra-badge');
      if (oldBadge) oldBadge.remove();
    }

    // --- 1. 图片截断 ---
    const imageLimit = app.forum.attribute<number>('synopsis.image_limit') ?? 3;
    const imgs = Array.from(dom.querySelectorAll('img')).filter((i) => !i.classList.contains('emoji'));

    imgs.forEach((img, i) => {
      if (i < imageLimit) {
        // 这是前 imageLimit 张图片，确保它们加载
        this.ensureSrc(img);
        img.loading = 'lazy';
        img.decoding = 'async';
      } else {
        // 这是多余的图片，从 DOM 中移除
        img.remove();
      }
    });

    // --- 2. [新] 空白节点清理 (来自成功的控制台测试) ---
    const nodesToRemove: Node[] = [];
    dom.childNodes.forEach(node => {
      if (node.nodeType === 1) { // 元素节点
        const text = node.textContent?.trim() || '';
        
        // 检查它是否是空的，或者 *只包含* "..."
        if (text === '' || text === '...') {
          // 确保这个节点里也没有图片 (防止误删)
          if (!(node as HTMLElement).querySelector('img')) {
            nodesToRemove.push(node);
          }
        }
      }
    });
    
    // 统一执行删除
    nodesToRemove.forEach(node => node.remove());

    // --- 3. 添加 +N 角标 ---
    const extra = Math.max(0, imgs.length - imageLimit);
    if (extra > 0 && !dom.querySelector('.synopsis-extra-badge')) {
      const badge = document.createElement('span');
      badge.className = 'synopsis-extra-badge';
      badge.textContent = `+${extra}`;
      // [已修复] 现在 appendChild 会紧跟在最后一个节点后，没有空白
      dom.appendChild(badge);
    }

    // 标记为已处理，并记录当前 post id
    dom.dataset.synopsisClamped = '1';
    dom.dataset.synopsisPostId = this.post?.id?.() ?? '';
    
    // [新] 处理完成，显示内容
    dom.style.visibility = 'visible';
  }
}
