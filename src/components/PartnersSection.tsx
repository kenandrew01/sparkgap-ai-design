const partners = [
  { name: "NVIDIA", logo: "NVIDIA" },
  { name: "Intel", logo: "Intel" },
  { name: "Siemens", logo: "Siemens" },
  { name: "AWS", logo: "AWS" },
  { name: "ARM", logo: "ARM" },
];

const PartnersSection = () => {
  return (
    <section className="py-12 border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <span className="text-sm font-semibold text-muted-foreground tracking-wider uppercase whitespace-nowrap">
            Trusted Industry Partners
          </span>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {partners.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-center rounded-lg border border-border bg-secondary/30 px-6 py-3 text-muted-foreground font-bold text-lg tracking-wide opacity-60 hover:opacity-100 transition-opacity"
              >
                {p.logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;