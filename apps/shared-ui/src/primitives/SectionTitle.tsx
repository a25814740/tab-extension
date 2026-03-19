export type SectionTitleProps = {
  title: string;
};

export function SectionTitle({ title }: SectionTitleProps) {
  return <h2 className="text-sm font-semibold text-slate-300">{title}</h2>;
}