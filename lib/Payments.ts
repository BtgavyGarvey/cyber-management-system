// lib/models/Subscription.ts
import mongoose, { Schema } from "mongoose";

const PaymentSchema = new Schema({
  provider: { type: String, required: true }, // "pesapal"
  method: { type: String, required: true }, // "pesapal"
  status: { type: String, required: true, index:true },   // "PENDING" | "COMPLETED" | "FAILED"
  amount: { type: Number, required: true },
  providerRef: { type: String, required: true, unique: true, index:true }, // track by provider order/transaction id
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
