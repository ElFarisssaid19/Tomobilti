<?php

return [

    'errors' => [
        'default' => 'An error occurred.',
        '400' => 'Bad request.',
        '401' => 'You must be logged in to access this resource.',
        '403' => 'You are not authorized to perform this action.',
        '404' => 'Resource not found.',
        '405' => 'HTTP method not allowed for this route.',
        '419' => 'Your session has expired. Please refresh the page.',
        '429' => 'Too many requests. Please try again in a moment.',
        '500' => 'Internal server error.',
        '503' => 'Service temporarily unavailable.',
    ],

    'auth' => [
        'registered' => 'Account created. A verification email has been sent to you.',
        'logged_in' => 'Logged in.',
        'logged_out' => 'You are logged out.',
        'inactive' => 'Your account is disabled. Contact the agency to reactivate it.',
        'reset_link_sent' => 'If an account exists for this address, you will receive a reset link shortly.',
    ],

    'verification' => [
        'verified' => 'Your email address is verified.',
        'already_verified' => 'Your email address is already verified.',
        'sent' => 'A new verification link has been sent to you.',
        'expired' => 'This verification link has expired. Request a new one.',
        'invalid' => 'This verification link is not valid.',
    ],

    'profile' => [
        'updated' => 'Profile saved.',
        'updated_verify_email' => 'Profile saved. Confirm your new email address with the link we just sent you.',
        'password_updated' => 'Password changed.',
    ],

    'admin' => [
        'pong' => 'Admin area is up. Hello, :name.',
    ],

    'validation' => [
        'phone' => 'Enter a valid Moroccan number, for example 06 12 34 56 78 or +212 6 12 34 56 78.',
        'email_taken' => 'An account already exists with this email address.',
        'terms' => 'You must accept the rental terms and conditions.',
        'min_age' => 'You must be at least :age years old.',
        'cin' => 'Enter a valid national ID number, for example BE123456.',
        'cin_taken' => 'This national ID number is already used by another account.',
        'license_in_future' => 'The licence issue date cannot be in the future.',
        'license_before_adult' => 'The licence cannot have been issued before you turned 18.',
        'password_same' => 'The new password must be different from the current one.',
    ],

];
