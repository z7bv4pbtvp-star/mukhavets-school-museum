export const NOTEBOOK_KEY = 'mukhavets.research.v1';
export const PLACE_IDS = ['museum', 'bogdanchuk', 'memorial'];
export function normalizeNotebook(value) {
  const result = {version:1, notes:{}, conclusion:''};
  if (value?.version !== 1) return result;
  for (const id of PLACE_IDS) {
    result.notes[id] = {};
    for (const field of ['observation','source','question']) {
      result.notes[id][field] = typeof value.notes?.[id]?.[field] === 'string' ? value.notes[id][field].slice(0,3000) : '';
    }
  }
  result.conclusion = typeof value.conclusion === 'string' ? value.conclusion.slice(0,5000) : '';
  return result;
}
export function hasObservation(note) { return Boolean(note?.observation?.trim() && note?.source?.trim()); }
export function notebookMarkdown(notebook, places, date) {
  const lines = ['# Мухавец. Дневник исследования', '', `Дата выгрузки: ${date}`, '',
    '## Вопрос исследования', '', 'Как школьный музей и два памятника сохраняют память о людях и событиях Мухавца?', '',
    '## Метод', '', 'Визуальное наблюдение, просмотр рассказов юных экскурсоводов, сопоставление надписей и исходных фотографий с 3D-реконструкцией.', ''];
  for (const place of places) {
    const note = notebook.notes[place.id] || {};
    lines.push(`## ${place.title}`, '', '### Моё наблюдение', '', note.observation?.trim() || 'Не заполнено.', '',
      '### Источник и подтверждение', '', note.source?.trim() || 'Не заполнено.', '',
      '### Вопрос для дальнейшей проверки', '', note.question?.trim() || 'Не записан.', '',
      `Материалы проекта: ${place.research.photoName}; видеорассказ «${place.title}» из фильма «ЮныеЭкскурсоводыСШп.Мухавец1.MOV»${place.videoRange ? `, фрагмент ${place.videoRange}` : ''}.`, '');
  }
  lines.push('## Мой общий вывод', '', notebook.conclusion?.trim() || 'Пока не сформулирован.', '',
    '## Ограничения', '', '3D-модели — ручные реконструкции по фото и видео. Размеры, формы и часть деталей приблизительные. Для чтения надписей следует сверяться с оригинальными снимками. Рассказ экскурсовода и наблюдение посетителя сами по себе не подтверждают архивный факт; спорные сведения требуют независимой проверки.', '',
    'Записи сделаны посетителем. Автоматическая проверка исторической достоверности не выполнялась.', '');
  return lines.join('\n');
}

export function notebookHtml(notebook, places, date) {
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const field=(title,text)=>`<h3>${escape(title)}</h3><p class="entry">${escape(text?.trim()||'Не заполнено.')}</p>`;
  const sections=places.map(place=>{const note=notebook.notes[place.id]||{};return `<section><h2>${escape(place.title)}</h2>${field('Моё наблюдение',note.observation)}${field('Источник и подтверждение',note.source)}${field('Вопрос для дальнейшей проверки',note.question)}<p class="source">Материалы проекта: ${escape(place.research.photoName)}. Видеорассказ: ${escape(place.videoRange)} исходного фильма «ЮныеЭкскурсоводыСШп.Мухавец1.MOV».</p></section>`;}).join('');
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Мухавец — дневник исследования</title><style>body{max-width:800px;margin:40px auto;padding:0 24px;font:16px/1.65 system-ui,sans-serif;color:#243b2b}h1{font-size:34px;line-height:1.15}h2{font-size:23px;line-height:1.3}h3{font-size:15px;margin:22px 0 5px}.entry{white-space:pre-wrap;margin:0}.source,footer{font-size:12px;color:#52654f}section{border-top:1px solid #bbc9b5;padding:20px 0}header>p{color:#52654f}@media print{body{margin:0;max-width:none;font-size:11pt}h1{font-size:24pt}h2{font-size:17pt}section{break-inside:avoid}.source,footer{font-size:9pt}}</style></head><body><header><p>МУХАВЕЦ · ШКОЛЬНОЕ ИССЛЕДОВАНИЕ</p><h1>Дневник исследования</h1><p>Дата выгрузки: ${escape(date)}</p></header><p><strong>Вопрос:</strong> как школьный музей и два памятника сохраняют память о людях и событиях Мухавца?</p><p><strong>Метод:</strong> наблюдение, просмотр видеорассказов и сопоставление деталей с оригинальными фотографиями.</p>${sections}<section><h2>Мой общий вывод</h2><p class="entry">${escape(notebook.conclusion?.trim()||'Пока не сформулирован.')}</p></section><footer>3D-модели — ручные реконструкции по фото и видео; размеры и часть деталей приблизительные. Исторические выводы требуют проверки по источникам. Записи сделаны посетителем. Файл открывается в браузере; для печати или сохранения в PDF используйте меню браузера → «Печать».</footer></body></html>`;
}
