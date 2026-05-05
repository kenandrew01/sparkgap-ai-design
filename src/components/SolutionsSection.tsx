import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import aerospaceImg from "@/assets/industry-aerospace.jpg";
import semiconductorImg from "@/assets/industry-semiconductor.jpg";
import consumerImg from "@/assets/industry-consumer.jpg";

const solutions = [
  {
    title: "Aerospace & Defense",
    image: aerospaceImg,
    description:
      "Cut 4–6 weeks off mission-critical board bring-up while staying compliant. Sparkgap.AI's physics-driven layouts meet MIL-STD requirements, enabling secure, in-house innovation.",
  },
  {
    title: "Semiconductor",
    image: semiconductorImg,
    description:
      "Eliminate layout bottlenecks in validation and test hardware. Sparkgap.AI delivers deterministic layouts in hours, helping your team hit tape-out deadlines and accelerate silicon test cycles.",
  },
  {
    title: "Consumer Electronics",
    image: consumerImg,
    description:
      "Hit market windows without layout bottlenecks. Sparkgap.AI delivers rapid, reliable PCB layout in hours — keeping consumer electronics teams ahead of deadlines without risking IP or quality.",
  },
];

const SolutionsSection = () => {
  const [active, setActive] = useState(0);

  return (
    <section id="solutions" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Solutions for the World's{" "}
            <span className="gradient-text">Most Demanding Programs</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Leaders who can least afford delays rely on Sparkgap.AI to eliminate layout bottlenecks and stay ahead of their competition.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {solutions.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setActive(i)}
              className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 text-left ${
                active === i
                  ? "border-primary/40 box-glow"
                  : "border-border hover:border-glow-soft"
              }`}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={s.image}
                  alt={s.title}
                  width={800}
                  height={512}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {s.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;