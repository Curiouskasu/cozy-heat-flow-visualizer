
import HeatTransferCalculator from "@/components/HeatTransferCalculator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Envelope Heat Transfer Calculator</h1>
          <p className="text-xl text-muted-foreground font-light">Calculate heat gains and losses for building envelopes</p>
        </div>
        <HeatTransferCalculator />
      </div>
    </div>
  );
};

export default Index;
