import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { password } = await request.json();

        if (!process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: "Server config missing" }, { status: 500 });
        }

        if (password === process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
