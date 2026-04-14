import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, artist, site } = req.body;

  if (!email || !artist) {
    return res.status(400).json({ error: '이메일과 아티스트를 입력해주세요.' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { error: dbError } = await supabase
      .from('alerts')
      .insert([{ email, artist, site, created_at: new Date().toISOString() }]);

    if (dbError) {
      console.error('DB Error:', dbError);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'noreply@tickr.kr',
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
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
