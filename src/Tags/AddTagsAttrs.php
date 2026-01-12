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

use Flarum\Tags\Api\Serializer\TagSerializer;
use Flarum\Tags\Tag;

class AddTagsAttrs
{
    public function __invoke(TagSerializer $serializer, Tag $tag, array $attributes): array
    {
        $attributes['richExcerpts'] = $tag->rich_excerpts;
        $attributes['excerptLength'] = $tag->excerpt_length;
        $attributes['isNsfw'] = $tag->is_nsfw;

        return $attributes;
    }
}
