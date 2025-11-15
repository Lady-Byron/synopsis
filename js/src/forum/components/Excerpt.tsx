import Component, { ComponentAttrs } from 'flarum/common/Component';
import Post from 'flarum/common/models/Post';
import { truncate } from 'flarum/common/utils/string';
import type Mithril from 'mithril';
import truncateHtml from '../utils/truncateHtml';

export interface ExcerptAttrs extends ComponentAttrs {
  post: Post;
  length: number;
  richExcerpt: boolean;
}

// [新] 限制显示的图片数量
const IMAGE_LIMIT = 3;

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
      // 我们仍然需要 truncateHtml 来截断 *文字*
      // 图片截断将在 processExcerptDOM 钩子中处理
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
   * 负责截断图片并添加 +N 角标
   */
  processExcerptDOM(vnode: Mithril.VnodeDOM<ExcerptAttrs, this>) {
    const dom = vnode.dom as HTMLElement;

    // 如果不是富文本，或者已经处理过，则跳过
    if (!this.richExcerpt) {
      dom.style.visibility = 'visible';
      return;
    }
    
    // 防止在重绘时重复运行
    if (dom.dataset.synopsisClamped === '1') {
      dom.style.visibility = 'visible'; // 确保在重绘时它仍然可见
      return;
    }

    const imgs = Array.from(dom.querySelectorAll('img')).filter((i) => !i.classList.contains('emoji'));

    imgs.forEach((img, i) => {
      if (i < IMAGE_LIMIT) {
        // 这是前 IMAGE_LIMIT 张图片，确保它们加载
        this.ensureSrc(img);
        img.loading = 'lazy';
        img.decoding = 'async';
      } else {
        // 这是多余的图片，从 DOM 中移除
        img.remove();
      }
    });

    // 添加 +N 角标
    const extra = Math.max(0, imgs.length - IMAGE_LIMIT);
    if (extra > 0 && !dom.querySelector('.synopsis-extra-badge')) {
      const badge = document.createElement('span');
      badge.className = 'synopsis-extra-badge';
      badge.textContent = `+${extra}`;
      dom.appendChild(badge);
    }

    // 标记为已处理
    dom.dataset.synopsisClamped = '1';
    
    // [新] 处理完成，显示内容
    dom.style.visibility = 'visible';
  }
}
