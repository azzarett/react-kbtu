export const statuses = [
  { value: "planned", label: "Хочу прочитать" },
  { value: "reading", label: "Читаю" },
  { value: "completed", label: "Прочитано" },
];

export function statusLabel(value) {
  return statuses.find((status) => status.value === value)?.label ?? value;
}
