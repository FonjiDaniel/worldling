export interface TemplateProps<Data> {
  data: Data;
  /** Set for non-security mail. */
  unsubscribeUrl?: string;
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
