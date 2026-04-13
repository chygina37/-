import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2'

const supabase = createClient(
  'https://tugudltjvkmlsnxsxfxk.supabase.co',
  'sb_publishable_jyrfna8HsUOO8bMOB2hVag_JFN6AbLb'
)
const resend = new Resend('re_7BTV6ub3_Vm6TQ6MVvC29vXihGsM3mnFK')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, artist, site } = req.body

  if (!email || !artist) {
    return res.status(400).json({ error: '이메일과 아티스트를 입력해주세요.' })
  }

  const { error: dbError } = await supabase
    .from('alerts')
    .insert([{ email, artist, site, created_at: new Date().toISOString() }])

  if (dbError) {
    return res.status(500).json({ error: '저장 실패: ' + dbError.message })
  }

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: `[TICKR] ${artist} 티켓 오픈 알림 등록 완료!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#ff3c00">🎫 TICKR</h2>
        <p>안녕하세요! <strong>${artist}</strong> 티켓 오픈 알림이 등록됐어요.</p>
        <p>티켓이 오픈되는 순간 바로 알려드릴게요!</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#888;font-size:13px">등록 정보</p>
        <p style="font-size:14px">🎤 아티스트: <strong>${artist}</strong></p>
        <p style="font-size:14px">🎟 사이트: <strong>${site || '전체'}</strong></p>
        <p style="font-size:14px">📧 이메일: <strong>${email}</strong></p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#888;font-size:12px">TICKR — 합법적이고 스마트한 티켓팅 도우미</p>
      </div>
    `
  })

  return res.status(200).json({ success: true })
}
