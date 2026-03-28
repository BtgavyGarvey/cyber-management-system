/* eslint-disable */

// app/api/payments/pesapal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPesapalToken } from "@/lib/pesapal";
import { connectToDatabase } from "@/lib/db";
import Payment from "@/lib/Payments"; // A model to store payment intents
// import { sessionActive } from "../../utils";
// import Error_Logs from "../../utils/ErrorLogs"
// import { validateCsrfToken } from "@/lib/csrf";
// import { validateOrigin } from "@/lib/originCheck";
// import { validateBrowser } from "@/lib/browserCheck";
// import { rateLimit } from "@/lib/rateLimit";


const NOTIFICATION_URL = `${process.env.NEXTAUTH_URL}/api/pesapal/webhook`; // e.g. 'https://yourdomain.com/api/donate/pesapal/webhook'


async function registerIPN() {
    try {
      const token = await getPesapalToken();
      const response = await fetch(`${process.env.PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: NOTIFICATION_URL,
          ipn_notification_type: 'POST'
        })
      });
  
      const data = await response.json();

    //   console.log({data, token})
  
      const res={token,ipn_id: data.ipn_id};
  
      return res;
    } catch (error) {
      console.error('Failed to register IPN:', error);
    }
  }

export async function POST(req: NextRequest) {
//   const session = await sessionActive(req)

  try {

    // Security checks
    // await Promise.all([
    //   validateCsrfToken(req),
    //   validateOrigin(req),
    //   validateBrowser(req)
    // ]);

    const orderTrackingId = new Date().getTime().toString();

    const { amount, mobile } = await req.json();
    // const userId = session?.user?.id;
    if (!amount || isNaN(amount) || amount <= 0) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
        // const limited = await rateLimit(userId || ip);
        // if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      
    const ipn = await registerIPN();


    if (!ipn || !ipn.token || !ipn.ipn_id) {
      console.error('IPN registration failed or returned incomplete data:', ipn);
      return NextResponse.json({ error: 'Failed to register IPN with Pesapal' }, { status: 500 });
    }

    const token = await getPesapalToken();

    const payload = {
        id: orderTrackingId,
        // amount: parseFloat(amount).toFixed(2),
        amount,
        currency: "KES",
        description: `Cyber Cafe Payment - ${amount} KES`,
        callback_url: `${process.env.NEXTAUTH_URL}/payment-status`, // user-facing
        notification_id: ipn.ipn_id,
        billing_address: {
            email_address: "", // provide actual
            phone_number: mobile || "", // provide actual
            country_code: "KE",
            first_name: "",
            last_name: "",
            middle_name: "",
            line_1: "Babadogo Lane",
            line_2: "",
            city: "Nairobi",
            state: "Nairobi",
            postal_code: "",
            zip_code: "",
        },
    };

    const resOrder = await fetch(`${process.env.PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!resOrder.ok) {
        return NextResponse.json({ error: "Pesapal order creation failed" }, { status: 502 });
    }

    const order = await resOrder.json();

    // console.log({order});
    
    // Save a payment intent to prevent replay and enable idempotency
    await connectToDatabase();

    await Payment.create({
        provider: "pesapal",
        method: "pesapal",
        status: "Pending",
        amount,
        providerRef: order.order_tracking_id, // or the field Pesapal returns
    });

    return NextResponse.json({ redirectUrl: order.redirect_url }); // Pesapal checkout URL

    } catch (error:any) {
        console.log("PLAYER_ERROR_PESAPAL_Payment", error);    
        
        // await Error_Logs(req,"PLAYER_ERROR_PESAPAL_Payment", error, session?.user?.id);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {

//   const session = await sessionActive(req)
      
  try {

      // Security checks
    //   await Promise.all([
    //       validateCsrfToken(req),
    //       validateOrigin(req),
    //       validateBrowser(req)
    //   ]);

    //   if (!session) {
    //       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    //   }

      const url = new URL(req.url || '');
      const transactionTrackingId = url.searchParams.get('OrderTrackingId');

      if (!transactionTrackingId) {
          return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }

      const ip = req.headers.get("x-forwarded-for") || "unknown";
    //   const limited = await rateLimit(session?.user?.id || ip);
    //   if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

      const payment = await Payment.find().sort({ createdAt: -1 }).limit(100).lean();
        
      return NextResponse.json({payment},{ status: 200 });
      
  } catch(error:any){
    console.log("PLAYER_ERROR_PESAPAL_Payment_FETCH", error);    
            
    // await Error_Logs(req,"PLAYER_ERROR_PESAPAL_Payment_FETCH", error, session?.user?.id);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}