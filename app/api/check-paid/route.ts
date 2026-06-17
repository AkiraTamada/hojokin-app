import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ isPaid: false })

  const { data } = await supabase
    .from('users')
    .select('is_paid')
    .eq('email', email)
    .single()

  return NextResponse.json({ isPaid: data?.is_paid || false })
}
