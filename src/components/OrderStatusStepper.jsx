// Shows the 4-stage order lifecycle: Placed (always true) → In Production
// (auto after 48h, regardless of payment) → On Transport (admin manual) →
// Received (multi-party — admin + staff/distributor + buyer, each with
// their own tick, all visible to everyone on the order).
export default function OrderStatusStepper({ stage, buyerKind }) {
  if (!stage) return null;

  const steps = [
    { key: "placed", label: "Placed", done: stage.placed },
    { key: "production", label: "In Production", done: stage.production },
    { key: "transport", label: "On Transport", done: stage.transport },
    { key: "received", label: "Received", done: stage.received.allDone },
  ];
  const currentIndex = steps.filter((s) => s.done).length - 1;

  return (
    <div>
      <div className="flex items-center w-full mb-4">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done ? "bg-status-success text-white" : "bg-navy-900/10 text-navy-900/40"
                  }`}
                >
                  {step.done ? "✓" : i + 1}
                </div>
                <span
                  className={`text-[10px] text-center max-w-[75px] ${
                    step.done ? "text-navy-900 font-medium" : "text-navy-900/40"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-1 mb-4 ${
                    i < currentIndex ? "bg-status-success" : "bg-navy-900/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Multi-party received confirmation detail */}
      <div className="bg-navy-900/[0.03] rounded-md p-3">
        <p className="text-xs font-semibold text-navy-900/70 mb-2">Received confirmation</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <ReceivedBox label="Admin" done={stage.received.admin} />
          {buyerKind === "customer" && <ReceivedBox label="Sales Rep" done={stage.received.staff} />}
          <ReceivedBox label={buyerKind === "distributor" ? "Distributor" : "Customer"} done={stage.received.buyer} />
        </div>
      </div>
    </div>
  );
}

function ReceivedBox({ label, done }) {
  return (
    <span className={`flex items-center gap-1.5 ${done ? "text-status-success" : "text-navy-900/40"}`}>
      <span
        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
          done ? "bg-status-success text-white" : "border border-navy-900/20"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      {label}
    </span>
  );
}
