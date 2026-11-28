<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /api/admin/cars/{car}/images (multipart): 1 to 10 photos, JPG, PNG or WebP,
 * 5 MB each at most. `mimes` reads the file content, not only its name.
 */
class CarImageUploadRequest extends FormRequest
{
    public const MAX_FILES = 10;

    public const MAX_KILOBYTES = 5120;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'images' => ['required', 'array', 'min:1', 'max:'.self::MAX_FILES],
            // `mimes` checks the content, `extensions` the file name. The maximum size in
            // pixels keeps a small but huge image (decompression bomb) away from GD.
            'images.*' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'extensions:jpg,jpeg,png,webp', 'max:'.self::MAX_KILOBYTES, 'dimensions:min_width=400,min_height=250,max_width=8000,max_height=8000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['images' => 'photos', 'images.*' => 'photo'];
    }
}
