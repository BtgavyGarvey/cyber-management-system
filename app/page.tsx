"use client";

import { useEffect, useState } from "react";
import { sendNotification } from "./utils/notify";
import { toast } from "sonner";


type Mode = "countup" | "countdown";

type Computer = {
  id: string;
  mode: Mode;
  countdown: number;
  countup: number;
  cost: number;
  notify: boolean;
};

export default function CyberPage() {
  const initialComputers: Computer[] = [
    { id: "Comp1", mode: "countup", countdown: 0, countup: 0, cost: 0, notify: false },
    { id: "Comp2", mode: "countup", countdown: 0, countup: 0, cost: 0, notify: false },
    { id: "Comp3", mode: "countup", countdown: 0, countup: 0, cost: 0, notify: false },
    { id: "Comp4", mode: "countup", countdown: 0, countup: 0, cost: 0, notify: false },
  ];

  const [computers, setComputers] = useState(initialComputers);

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setComputers(prev =>
        prev.map(comp => {
          if (comp.mode === "countdown" && comp.countdown > 0) {
            return { ...comp, countdown: comp.countdown - 1 };
          } else if (comp.mode === "countup") {
            const newCountup = comp.countup + 1;
            return { ...comp, countup: newCountup, cost: Math.floor(newCountup / 60) };
          } else if (comp.mode === "countdown" && comp.countdown === 0) {
            return { ...comp, notify: true };
          }
          return comp;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Notification loop every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      computers.forEach(comp => {
        if (comp.notify) {
          sendNotification(`${comp.id} session expired! Reset required.`);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [computers]);

  // Start countdown based on amount paid
  const startCountdown = (id: string, amount: number) => {
    const minutes = amount; // KSH 1 per minute
    setComputers(prev =>
      prev.map(comp =>
        comp.id === id
          ? { ...comp, mode: "countdown", countdown: minutes * 60, countup: 0, cost: amount, notify: false }
          : comp
      )
    );
  };

  // Switch to countup mode
  const startCountup = (id: string) => {
    setComputers(prev =>
      prev.map(comp =>
        comp.id === id
          ? { ...comp, mode: "countup", countdown: 0, countup: 0, cost: 0, notify: false }
          : comp
      )
    );
  };

  // Reset computer
  const resetComputer = (id: string) => {
    setComputers(prev =>
      prev.map(comp =>
        comp.id === id
          ? { ...comp, mode: "countup", countdown: 0, countup: 0, cost: 0, notify: false }
          : comp
      )
    );
  };

  const startPesapal = async (amount: number, mobile: number) => {
    if (amount <= 0 || isNaN(amount)) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (isNaN(mobile) || mobile.toString().length < 9) {
      toast.error("Please enter a valid mobile number.");
      return;
    }
    toast.info("Redirecting to Pesapal...");
    const res = await fetch("/api/pesapal", {
      method: "POST",
      body: JSON.stringify({ amount, mobile }),
    });
    const data = await res.json();
    toast.dismiss();
    if(!res.ok){
      toast.error(data?.error || data?.message || "Failed to initiate Pesapal payment.");
      return;
    }
    if (data.redirectUrl) window.location.href = data.redirectUrl;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Cyber Management System</h1>
      <div className="flex justify-center mb-8">
        <button
          onClick={() => {
            const amount = parseInt(prompt("Enter amount to pay (KSH):") || "0");
            const mobile = parseInt(prompt("Enter mobile number:") || "");
            if (isNaN(amount) || amount <= 0) {
              toast.error("Please enter a valid amount.");
              return;
            }
            if (isNaN(mobile) || mobile.toString().length < 9) {
              toast.error("Please enter a valid mobile number.");
              return;
            }
            startPesapal(amount, mobile);
          }}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
        >
          Initiate Payment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {computers.map(comp => {
          const minutesLeft = Math.floor(comp.countdown / 60);
          const secondsLeft = comp.countdown % 60;
          const minutesUp = Math.floor(comp.countup / 60);
          const secondsUp = comp.countup % 60;

          return (
            <div key={comp.id} className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">{comp.id}</h2>

              {comp.mode === "countdown" ? (
                <div>
                  <p className="text-green-600 font-bold">Countdown Mode</p>
                  <p className="text-lg">
                    Time Left: {minutesLeft}:{secondsLeft.toString().padStart(2, "0")}
                  </p>
                  <p className="text-lg">Paid: KSH {comp.cost}</p>
                  {comp.countdown === 0 && (
                    <p className="text-red-600 font-bold animate-pulse">
                      ⏰ Session expired! Notifications active.
                    </p>
                  )}
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => resetComputer(comp.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-blue-600 font-bold">Countup Mode</p>
                  <p className="text-lg">
                    Time: {minutesUp}:{secondsUp.toString().padStart(2, "0")}
                  </p>
                  <p className="text-lg">Cost: KSH {comp.cost}</p>
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => {
                        const amount = parseInt(prompt("Enter amount paid (KSH):") || "0");
                        if (amount > 0) startCountdown(comp.id, amount);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Switch to Countdown
                    </button>
                    <button
                      onClick={() => startCountup(comp.id)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Reset Countup
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
