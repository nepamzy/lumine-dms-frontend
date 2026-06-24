const STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "paid", label: "Payment Confirmed" },
  { key: "processing", label: "Preparing" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderStatusStepper({ status }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-status-danger font-semibold text-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-status-danger inline-block" />
        Order Cancelled
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const isComplete = i <= currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isComplete ? "bg-status-success text-white" : "bg-navy-900/10 text-navy-900/40"
                }`}
              >
                {isComplete ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] text-center max-w-[70px] ${
                  isComplete ? "text-navy-900 font-medium" : "text-navy-900/40"
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
  );
}
