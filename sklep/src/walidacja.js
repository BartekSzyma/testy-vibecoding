export function walidujEmail(email) {
  return typeof email === 'string' && email.includes('@');
}

export function walidujZamowienie({ imie, email, adres }) {
  const bledy = [];
  if (!imie || !imie.trim()) bledy.push('imie');
  if (!walidujEmail(email)) bledy.push('email');
  if (!adres || !adres.trim()) bledy.push('adres');
  return { ok: bledy.length === 0, bledy };
}
