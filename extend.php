<?php

/*
 * This file is part of fof/synopsis.
 *
 * (c) FriendsOfFlarum
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace FoF\Synopsis;

use Flarum\Api\Controller\ListDiscussionsController;
use Flarum\Api\Controller\UpdateDiscussionController;
use Flarum\Extend;
use Flarum\Tags\Api\Serializer\TagSerializer;
use Flarum\Tags\Event\Saving as TagSaving;
use Flarum\Tags\Tag;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/resources/less/forum/extension.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js'),

    new Extend\Locales(__DIR__.'/resources/locale'),

    (new Extend\Model(Tag::class))
        ->cast('excerpt_length', 'int')
        ->cast('rich_excerpts', 'bool'),

    (new Extend\Settings())
        ->default('fof-synopsis.excerpt_length', 200)
        ->default('fof-synopsis.rich-excerpts', false)
        ->default('fof-synopsis.excerpt-type', 'first')
        ->default('fof-synopsis.disable-when-searching', true)
        ->default('fof-synopsis.image_limit', 3)
        ->serializeToForum('synopsis.excerpt_length', 'fof-synopsis.excerpt_length', 'intVal')
        ->serializeToForum('synopsis.rich_excerpts', 'fof-synopsis.rich-excerpts', 'boolVal')
        ->serializeToForum('synopsis.excerpt_type', 'fof-synopsis.excerpt-type')
        ->serializeToForum('synopsis.disable_when_searching', 'fof-synopsis.disable-when-searching', 'boolval')
        ->serializeToForum('synopsis.image_limit', 'fof-synopsis.image_limit', 'intVal'),

    (new Extend\ApiController(ListDiscussionsController::class))
        ->prepareDataForSerialization(LoadRelations::class),

    (new Extend\ApiController(UpdateDiscussionController::class))
        ->prepareDataForSerialization(LoadRelations::class),
    
    (new Extend\Event())
        ->listen(TagSaving::class, Tags\Saving::class),

    (new Extend\ApiSerializer(TagSerializer::class))
        ->attributes(Tags\AddTagsAttrs::class),
];
