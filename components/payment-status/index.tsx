"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export default function PesapalReturnPage() {
  const searchParams = useSearchParams();
  const OrderTrackingId = searchParams.get("OrderTrackingId");
  // const payment_account = searchParams.get("payment_account");
  const [paymentData, setPaymentData] = useState<any>(null);
  const name = paymentData?.payment_account || "Payment Verification";
  const [status, setStatus] = useState("Verifying payment...");
  const [statusType, setStatusType] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!OrderTrackingId) return toast.error("Missing OrderTrackingId in query parameters.");

      try {
        const response = await fetch(`/api/pesapal/webhook?OrderTrackingId=${OrderTrackingId}`);
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          setStatus("Payment completed successfully!");
          setStatusType("success");
          setPaymentData(data);
        } else {
          setStatus(data?.error || data?.message || "Payment verification failed.");
          setStatusType("error");
        }
      } catch {
        setStatus("Payment verification failed.");
        setStatusType("error");
      }
    };

    verifyPayment();
  }, [OrderTrackingId]);

  const statusColors = {
    loading: "text-yellow-300",
    success: "text-green-400",
    error: "text-red-400",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
      <motion.div
        className="w-full max-w-lg bg-gray-800 rounded-xl shadow-2xl p-6 space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.h1
          className="text-3xl font-extrabold tracking-wide text-white text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {name || "Payment Verification"}
        </motion.h1>

        {/* Status */}
        <motion.h2
          className={`text-xl font-bold text-center ${statusColors[statusType]}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {status}
        </motion.h2>

        {/* Payment Data Card */}
        {paymentData && (
          <motion.div
            className="bg-gray-900 rounded-lg p-5 shadow-lg space-y-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Transaction Details
            </h3>
            <div className="space-y-2 text-gray-300">
              <p><span className="font-bold text-white">Provider Ref:</span> {paymentData.providerRef}</p>
              <p><span className="font-bold text-white">Status:</span> {paymentData.status}</p>
              <p><span className="font-bold text-white">Amount:</span> KSH {paymentData.amount}</p>
              <p><span className="font-bold text-white">Payment Account:</span> {paymentData.payment_account}</p>
              <p><span className="font-bold text-white">Message:</span> {paymentData.message}</p>
            </div>
          </motion.div>
        )}

        <motion.button
          onClick={() => window.location.href = "/"}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
}
