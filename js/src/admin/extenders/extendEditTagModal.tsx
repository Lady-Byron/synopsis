import app from 'flarum/admin/app';
import EditTagModal from 'flarum/tags/admin/components/EditTagModal';
import { extend } from 'flarum/common/extend';
import Stream from 'flarum/common/utils/Stream';

export default function () {
  extend(EditTagModal.prototype, 'oninit', function () {
    // [更改]
    // 如果 this.tag.exists 为 true (编辑旧标签)，则使用已存的值。
    // 如果为 false (新建标签)，则默认值设为 true。
    this.richExcerpts = new Stream(this.tag.exists ? this.tag.richExcerpts() : true);
    this.excerptLength = new Stream(this.tag.excerptLength());
  });

  extend(EditTagModal.prototype, 'submitData', function (data) {
    data.richExcerpts = this.richExcerpts();
    data.excerptLength = this.excerptLength();

    return data;
  });

  extend(EditTagModal.prototype, 'fields', function (items) {
    items.add(
      'synopsis-excerpt-length',
      <div className="Form-group">
        <label>{app.translator.trans('fof-synopsis.admin.settings.excerpt-length.label')}</label>
        <input className="FormControl" type="number" min="0" bidi={this.excerptLength} />
        <div>{app.translator.trans('fof-synopsis.admin.settings.excerpt-length.help')}</div>
      </div>,
      5
    );

    items.add(
      'synopsis-rich-excerpts',
      <div className="Form-group">
        <div>
          <label className="checkbox">
            <input type="checkbox" bidi={this.richExcerpts} />
            {app.translator.trans('fof-synopsis.admin.settings.rich-excerpts.label')}
          </label>
        </div>
        <div>{app.translator.trans('fof-synopsis.admin.settings.rich-excerpts.help')}</div>
      </div>,
      5
    );
  });
}
