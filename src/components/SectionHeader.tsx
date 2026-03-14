export const SectionHeader = ({
  title,
  dark = false,
  as: Tag = 'h2',
}: {
  title: string;
  dark?: boolean;
  as?: 'h1' | 'h2';
}) => (
  <Tag className={`text-5xl md:text-7xl font-black tracking-tighter mb-12 md:mb-20 ${dark ? 'text-stone-900' : 'text-stone-900'}`}>
    {title}
  </Tag>
);
