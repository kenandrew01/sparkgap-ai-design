import nvidiaLogo from "@/assets/logo-nvidia.png";
import intelLogo from "@/assets/logo-intel.png";
import siemensLogo from "@/assets/logo-siemens.png";
import awsLogo from "@/assets/logo-aws.png";
import armLogo from "@/assets/logo-arm.png";

const partners = [
  { name: "NVIDIA", logo: nvidiaLogo, url: "https://www.nvidia.com" },
  { name: "Intel", logo: intelLogo, url: "https://www.intel.com" },
  { name: "Siemens", logo: siemensLogo, url: "https://www.siemens.com" },
  { name: "AWS", logo: awsLogo, url: "https://aws.amazon.com" },
  { name: "ARM", logo: armLogo, url: "https://www.arm.com" },
];

const PartnersSection = () => {
  const loop = [...partners, ...partners];
  return (
    <section className="py-16 border-b border-border/50">
      <div className="container mx-auto px-6 mb-8">
        <p className="text-center text-sm font-semibold text-muted-foreground tracking-wider uppercase">
          Trusted Industry Partners
        </p>
      </div>
      <div
        className="group relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div className="flex w-max animate-marquee gap-12 md:gap-20 group-hover:[animation-play-state:paused]">
          {loop.map((p, i) => (
            <a
              key={`${p.name}-${i}`}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={p.name}
              className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/30 px-10 py-6 opacity-70 hover:opacity-100 hover:border-primary/50 transition-all"
            >
              <img
                src={p.logo}
                alt={`${p.name} logo`}
                loading="lazy"
                className="h-16 md:h-20 w-auto object-contain"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;