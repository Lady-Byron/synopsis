import app from 'flarum/admin/app';
import extendEditTagModal from './extenders/extendEditTagModal';
import typeOptions from './util/typeOptions';

export { default as extend } from './extend';

app.initializers.add('lady-byron-synopsis', () => {
  app.extensionData
    .for('fof-synopsis')
    .registerSetting(function () {
      if (!('flarum-tags' in flarum.extensions)) return;
      return (
        <div className="Form-group">
          <p className="helpText">{app.translator.trans('fof-synopsis.admin.settings.tags-enabled')}</p>
        </div>
      );
    })
    .registerSetting({
      label: app.translator.trans('fof-synopsis.admin.settings.excerpt-length.label'),
      help: app.translator.trans('fof-synopsis.admin.settings.excerpt-length.help'),
      setting: 'fof-synopsis.excerpt_length',
      type: 'number',
    })
    .registerSetting({
      label: app.translator.trans('fof-synopsis.admin.settings.rich-excerpts.label'),
      help: app.translator.trans('fof-synopsis.admin.settings.rich-excerpts.help'),
      setting: 'fof-synopsis.rich-excerpts',
      type: 'boolean',
    })
    .registerSetting({
      label: app.translator.trans('fof-synopsis.admin.settings.image-limit.label'),
      help: app.translator.trans('fof-synopsis.admin.settings.image-limit.help'),
      setting: 'fof-synopsis.image_limit',
      type: 'number',
      min: 0,
    })
    .registerSetting({
      label: app.translator.trans('fof-synopsis.admin.settings.excerpt-type.label'),
      help: app.translator.trans('fof-synopsis.admin.settings.excerpt-type.help'),
      setting: 'fof-synopsis.excerpt-type',
      options: typeOptions(),
      type: 'select',
    })
    .registerSetting({
      label: app.translator.trans('fof-synopsis.admin.settings.disable-when-searching.label'),
      help: app.translator.trans('fof-synopsis.admin.settings.disable-when-searching.help'),
      setting: 'fof-synopsis.disable-when-searching',
      type: 'switch',
    });

  extendEditTagModal();
});
