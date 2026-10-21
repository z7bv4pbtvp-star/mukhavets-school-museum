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
