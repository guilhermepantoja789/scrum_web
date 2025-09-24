import { NextResponse } from "next/server"

export function success(data: any, message = "OK", status = 200) {
    return NextResponse.json({ success: true, data, message }, { status })
}

export function error(message: string, status = 400) {
    return NextResponse.json({ success: false, message }, { status })
}
