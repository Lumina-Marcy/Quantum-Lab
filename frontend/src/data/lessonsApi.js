const API = '/api/lessons';

export async function fetchLessons() {
  const res = await fetch(API);
  if (!res.ok) throw new Error('Failed to load lessons');
  return res.json();
}

export async function fetchLessonById(id) {
  const res = await fetch(`${API}/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load lesson');
  return res.json();
}

export function groupByCategory(lessons) {
  const categories = [...new Set(lessons.map((lesson) => lesson.category))];
  return categories.map((category) => ({
    category,
    lessons: lessons.filter((lesson) => lesson.category === category),
  }));
}
