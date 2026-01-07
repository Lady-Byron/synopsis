<?php

/*
 * This file is part of fof/synopsis.
 *
 * (c) FriendsOfFlarum
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace FoF\Synopsis\Tags;

use Flarum\Tags\Event\Saving as Event;
use Illuminate\Support\Arr;

class Saving
{
    public function handle(Event $event)
    {
        $attributes = Arr::get($event->data, 'attributes', []);

        // [修复] 只在属性存在时才更新
        if (Arr::has($attributes, 'excerptLength')) {
            $excerptLength = Arr::get($attributes, 'excerptLength');
            $event->tag->excerpt_length = $excerptLength === '' || $excerptLength === null ? null : (int) $excerptLength;
        }

        if (Arr::has($attributes, 'richExcerpts')) {
            $richExcerpts = Arr::get($attributes, 'richExcerpts');
            $event->tag->rich_excerpts = $richExcerpts === null ? null : (bool) $richExcerpts;
        }
    }
}
