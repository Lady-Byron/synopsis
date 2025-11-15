import { extend } from 'flarum/common/extend';
import app from 'flarum/forum/app';
import DiscussionListState from 'flarum/forum/states/DiscussionListState';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import ItemList from 'flarum/common/utils/ItemList';
import type Mithril from 'mithril';
import Excerpt from './components/Excerpt';

export default function addSummaryExcerpt() {
  extend(DiscussionListState.prototype, 'requestParams', function (params) {
    if (typeof params.include === 'string') {
      params.include = [params.include];
    } else {
      params.include = params.include || [];
    }

    if (app.forum.attribute<string>('synopsis.excerpt_type') === 'first') {
      params.include.push('firstPost');
    } else {
      params.include.push('lastPost');
    }
  });

  extend(DiscussionListItem.prototype, 'infoItems', function (items: ItemList<Mithril.Children>) {
    // Skip if we are searching to preserve most relevant post content as excerpt,
    // that way we also preserve highlighting of search terms in the most relevant post.
    // @ts-expect-error
    if (app.forum.attribute('synopsis.disable_when_searching') && app.discussions.params.q) return;

    const discussion = this.attrs.discussion;

    // [已移除] 删除了对 app.session.user.preferences().showSynopsisExcerpts 的检查
    // 摘要将对所有用户强制显示

    // --- [更改 1：取最小值逻辑] ---
    const tags = discussion.tags() || []; // 确保 tags 是一个数组

    const excerptPost = app.forum.attribute<string>('synopsis.excerpt_type') === 'first' ? discussion.firstPost() : discussion.lastPost();

    // “取最小值”逻辑：摘要长度
    // 1. 遍历所有标签，提取所有被设置过的长度 (过滤掉 null 或 undefined)
    const setLengths = tags
      .map(t => t.excerptLength())
      .filter(length => typeof length === 'number');

    // 2. 如果存在被设置的长度，则取最小值；否则使用全局默认值
    const excerptLength = setLengths.length > 0
      ? Math.min(...setLengths)
      : app.forum.attribute<number>('synopsis.excerpt_length');

    
    // “取最小值”逻辑：富文本 (并修复原版 Bug)
    // 这里的“最小值”逻辑是：只要有一个标签设置为 "false" (纯文本)，最终结果就是 "false"
    const setRichSettings = tags.map(t => t.richExcerpts());

    let richExcerpt;
    if (setRichSettings.length > 0) {
      // 2. 如果数组中包含 "false"（即有标签要求纯文本），则结果为 "false"
      richExcerpt = !setRichSettings.includes(false);
    } else {
      // 3. 如果没有标签，或没有设置，使用全局默认值
      richExcerpt = app.forum.attribute<boolean>('synopsis.rich_excerpts');
    }

    // --- [更改 2：强制移动端显示] ---
    const onMobile = true;

    // A length of zero means we don't want a synopsis for this discussion, so do nothing.
    if (excerptLength === 0) {
      return;
    }

    if (excerptPost) {
      const excerpt = <Excerpt post={excerptPost} length={excerptLength} richExcerpt={richExcerpt} />;

      items.add('excerpt', excerpt, -100);
      onMobile && items.add('excerptM', excerpt, -100); // onMobile 现在永远为 true
    }
  });
}
