<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsStaff
{
    /** Staff AND admin can pass (admins outrank staff). */
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->isStaffOrAbove(), 403, 'Staff access required.');

        return $next($request);
    }
}
