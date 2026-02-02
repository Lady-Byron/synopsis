import Tag from 'flarum/tags/common/models/Tag';
import EditTagModal from 'flarum/tags/admin/components/EditTagModal';
import Stream from 'flarum/common/utils/Stream';

declare module 'flarum/tags/common/models/Tag' {
  export default interface Tag {
    richExcerpts(): boolean;
    excerptLength(): number;
    isNsfw(): boolean;
  }
}

declare module 'flarum/tags/admin/components/EditTagModal' {
  export default interface EditTagModal {
    richExcerpts: Stream<boolean>;
    excerptLength: Stream<number>;
    isNsfw: Stream<boolean>;
    submitData(): {
      name: string;
      slug: string;
      description: string;
      color: string;
      icon: string;
      isHidden: boolean;
      primary: boolean;
      richExcerpts: boolean;
      excerptLength: number;
      isNsfw: boolean;
    };
  }
}
