import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-lg font-semibold">POC Trading Platform</h1>
      <Button onClick={() => console.log("clicked")}>Get Started</Button>
    </div>
  );
}

export default App;
