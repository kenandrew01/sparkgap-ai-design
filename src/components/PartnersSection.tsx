import nvidiaLogo from "@/assets/logo-nvidia.png";
import intelLogo from "@/assets/logo-intel.png";
import siemensLogo from "@/assets/logo-siemens.png";
import awsLogo from "@/assets/logo-aws.png";
import armLogo from "@/assets/logo-arm.png";

const partners = [
  { name: "NVIDIA", logo: nvidiaLogo },
  { name: "Intel", logo: intelLogo },
  { name: "Siemens", logo: siemensLogo },
  { name: "AWS", logo: awsLogo },
  { name: "ARM", logo: armLogo },
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
                className="flex items-center justify-center rounded-lg border border-border bg-secondary/30 px-6 py-3 opacity-60 hover:opacity-100 transition-opacity"
              >
                <img
                  src={p.logo}
                  alt={`${p.name} logo`}
                  loading="lazy"
                  className="h-8 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;