// OneSignal player ID'yi Supabase'e kaydet
export async function registerPushPlayer(supabase, userId) {
  try {
    if (!window.OneSignal) return
    const playerId = await window.OneSignal.getUserId()
    if (!playerId) return
    await supabase.from('profiles').update({ onesignal_player_id: playerId }).eq('id', userId)
  } catch (e) {
    console.log('Push register error:', e)
  }
}

// Bildirim gönder (Supabase Edge Function üzerinden)
export async function sendPushNotification(toPlayerId, title, message) {
  if (!toPlayerId) return
  try {
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic os_v2_app_8f3b18b5-85bf-478f-972d-a55a8d1c1c58'
      },
      body: JSON.stringify({
        app_id: '8f3b18b5-85bf-478f-972d-a55a8d1c1c58',
        include_player_ids: [toPlayerId],
        headings: { tr: title },
        contents: { tr: message },
        url: 'https://aemlak-danismanlik.netlify.app/mesajlar'
      })
    })
  } catch(e) {
    console.log('Push send error:', e)
  }
}
