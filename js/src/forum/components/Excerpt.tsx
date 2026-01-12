import Component, { ComponentAttrs } from 'flarum/common/Component';
import app from 'flarum/forum/app';
import Post from 'flarum/common/models/Post';
import { truncate } from 'flarum/common/utils/string';
import type Mithril from 'mithril';
import truncateHtml, { TruncateResult } from '../utils/truncateHtml';

export interface ExcerptAttrs extends ComponentAttrs {
  post: Post;
  length: number;
  richExcerpt: boolean;
  isNsfw: boolean;
}

export default class Excerpt extends Component<ExcerptAttrs> {
  // 缓存截断结果，避免 view() 重复计算
  private truncateResult: TruncateResult | null = null;

  view() {
    const { isNsfw, richExcerpt } = this.attrs;
    const className = 'Synopsis-excerpt' + (isNsfw ? ' synopsis-nsfw' : '');
    
    const content = this.getContent();
    const extraBadge = this.getExtraBadge();
    
    return (
      <div className={className}>
        {content}
        {extraBadge}
      </div>
    );
  }

  getContent(): Mithril.Vnode | string {
    const { post, length, richExcerpt } = this.attrs;
    
    if (richExcerpt) {
      const html = post.contentHtml() ?? '';
      const imageLimit = app.forum.attribute<number>('synopsis.image_limit') ?? 1;
      this.truncateResult = truncateHtml(html, length, imageLimit);
      return m.trust(this.truncateResult.html);
    }

    this.truncateResult = null;
    return truncate(post.contentPlain() ?? '', length);
  }

  getExtraBadge(): Mithril.Vnode | null {
    if (!this.truncateResult) return null;
    
    const imageLimit = app.forum.attribute<number>('synopsis.image_limit') ?? 1;
    const extra = Math.max(0, this.truncateResult.totalImages - imageLimit);
    
    if (extra > 0) {
      return <span className="synopsis-extra-badge">+{extra}</span>;
    }
    
    return null;
  }
}
