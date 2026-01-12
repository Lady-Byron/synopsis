<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasColumn('tags', 'is_nsfw')) {
            $schema->table('tags', function (Blueprint $table) {
                $table->boolean('is_nsfw')->nullable();
            });
        }
    },
    'down' => function (Builder $schema) {
        $schema->table('tags', function (Blueprint $table) {
            $table->dropColumn('is_nsfw');
        });
    },
];
