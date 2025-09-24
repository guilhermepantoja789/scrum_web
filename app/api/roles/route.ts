import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { RoleService } from "@/lib/data/roles"

export const GET = withAuth(async () => {
    const roles = await RoleService.list()
    return NextResponse.json({ success: true, data: roles })
})

export const POST = withAuth(async (_user, req) => {
    const body = await req.json()
    const role = await RoleService.create(body)
    return NextResponse.json({ success: true, data: role }, { status: 201 })
})