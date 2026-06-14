export const API_BASE = 'https://kvartstory-api.grghomelab.me'

export const MONTHS_HR = ['sij','velj','ožu','tra','svi','lip','srp','kol','ruj','lis','stu','pro']
export const MONTHS_FULL = ['siječnja','veljače','ožujka','travnja','svibnja','lipnja','srpnja','kolovoza','rujna','listopada','studenoga','prosinca']

export function formatDate(dateStr) {
  if (!dateStr) return { day: '–', month: '–', full: '–', time: '' }
  const d = new Date(dateStr)
  const day = d.getDate()
  const mon = d.getMonth()
  const yr = d.getFullYear()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const time = `${h}:${m}`
  return {
    day,
    month: MONTHS_HR[mon],
    full: `${day}. ${MONTHS_FULL[mon]} ${yr}.`,
    time: time === '00:00' ? '' : time,
  }
}

export function normalizeText(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function slugifyLocation(str) {
  return normalizeText(str).replace(/\s+/g, '-')
}

export function animateNumber(setter, target) {
  if (target === 0) { setter('0'); return }
  let current = 0
  const step = Math.ceil(target / 30)
  const timer = setInterval(() => {
    current = Math.min(current + step, target)
    setter(String(current))
    if (current >= target) clearInterval(timer)
  }, 40)
  return timer
}
