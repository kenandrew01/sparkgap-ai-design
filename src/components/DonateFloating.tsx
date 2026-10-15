import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PRESETS = [5, 10, 25];

const DonateFloating = () => {
  const [amount, setAmount] = useState<number>(10);
  const [custom, setCustom] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    const value = custom ? Number(custom) : amount;
    if (!value || value < 1) {
      toast({
        title: "Enter an amount",
        description: "Minimum donation is $1.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-donation",
        { body: { amount: value } },
      );
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      toast({
        title: "Could not start checkout",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 w-[15rem] max-w-[calc(100vw-2rem)]">
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur-xl p-3 shadow-2xl box-glow">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 inline-flex rounded-md bg-secondary p-1.5 w-fit shrink-0">
            <Heart className="h-3 w-3 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground leading-snug">
              Support our mission
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              Donate to fund development. Apple Pay, Google Pay, card or Link.
            </p>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setAmount(p);
                setCustom("");
              }}
              className={`rounded-md border px-1 py-1 text-xs transition-colors ${
                !custom && amount === p
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>

        <div className="mt-1.5 flex items-center gap-1 rounded-md border border-border bg-secondary/50 px-1.5 focus-within:border-primary">
          <span className="text-xs text-muted-foreground">$</span>
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Custom"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="w-full bg-transparent py-1 text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>

        <Button
          size="sm"
          onClick={handleDonate}
          disabled={loading}
          className="w-full h-7 mt-2 px-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90 box-glow"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Heart className="h-3 w-3 mr-1" />
          )}
          Donate ${custom || amount}
        </Button>
      </div>
    </div>
  );
};

export default DonateFloating;
