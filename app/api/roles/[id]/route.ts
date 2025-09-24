import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { RoleService } from "@/lib/data/roles"

export const PUT = withAuth(async (_user, req, { params }) => {
    const id = params?.id
    if (!id) return NextResponse.json({ success: false, message: "ID é obrigatório" }, { status: 400 })

    const body = await req.json()
    const role = await RoleService.update(id, body)
    return NextResponse.json({ success: true, data: role })
})

export const DELETE = withAuth(async (_user, _req, { params }) => {
    const id = params?.id
    if (!id) return NextResponse.json({ success: false, message: "ID é obrigatório" }, { status: 400 })

    await RoleService.remove(id)
    return NextResponse.json({ success: true })
})