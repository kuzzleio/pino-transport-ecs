export function expandBinding<T extends Record<string, any> | string | any[]>(binding: T): T {
  if (Array.isArray(binding)) {
    return binding.map(expandBinding) as T;
  }

  if (typeof binding === 'object') {
    return Object.fromEntries(
      Object.entries(binding).map(([key, value]) => {
        return [key, expandBinding(value)];
      }),
    ) as T;
  }

  if (typeof binding === 'string') {
    return binding.replace(/{{([^{]+)}}/g, (_, template) => {
      if (template.trim() === 'currentDate') {
        return new Date().toISOString();
      }
      throw new Error(`Unknown template: ${template}`);
    }) as T;
  }

  return binding;
}
