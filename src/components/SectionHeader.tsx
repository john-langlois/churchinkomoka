export const SectionHeader = ({ title, dark = false }: { title: string, dark?: boolean }) => (
  <h2 className={`text-5xl md:text-7xl font-black tracking-tighter mb-12 md:mb-20 ${dark ? 'text-stone-900' : 'text-stone-900'}`}>
    {title}
  </h2>
);
