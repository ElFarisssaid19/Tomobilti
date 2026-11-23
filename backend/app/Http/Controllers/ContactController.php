<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactRequest;
use App\Mail\ContactMessageMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    /**
     * POST /api/contact: queue the visitor's message to the agency mailbox (the
     * reply goes straight to the visitor thanks to Reply-To).
     */
    public function store(ContactRequest $request): JsonResponse
    {
        Mail::to(config('tomobilti.agency.email'))->send(new ContactMessageMail(
            senderName: $request->validated('name'),
            senderEmail: $request->validated('email'),
            topic: $request->validated('subject'),
            body: $request->validated('message'),
            senderPhone: $request->validated('phone'),
        ));

        return response()->json(['message' => __('api.contact.sent')]);
    }
}
