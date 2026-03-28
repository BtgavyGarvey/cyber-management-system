/* eslint-disable */

// app/api/payments/pesapal/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getPesapalToken } from "@/lib/pesapal";
import Payments from "@/lib/Payments";
// import { activateSubscription } from "@/lib/services/subscription";
// import { sessionActive } from "@/app/api/utils";
// import Error_Logs from "../../../utils/ErrorLogs"
// import { getCountryFromIP } from "@/lib/utils";
// import { validateCsrfToken } from "@/lib/csrf";
// import { validateOrigin } from "@/lib/originCheck";
// import { validateBrowser } from "@/lib/browserCheck";
// import { rateLimit } from "@/lib/rateLimit";


export async function GET(req: NextRequest) {

    // const session = await sessionActive(req)
    
    try {

        // Security checks
        // await Promise.all([
        //     validateCsrfToken(req),
        //     validateOrigin(req),
        //     validateBrowser(req)
        // ]);

        // if (!session) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        const url = new URL(req.url || '');
        const transactionTrackingId = url.searchParams.get('OrderTrackingId');

        if (!transactionTrackingId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // const ip = req.headers.get("x-forwarded-for") || "unknown";
                // const limited = await rateLimit(session?.user?.id || ip);
                // if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

        const token = await getPesapalToken();
        
        const url_ = `${process.env.PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${transactionTrackingId}`;
        const resStatus = await fetch(
            url_,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const statusData = await resStatus.json();

        const data = {
            status: statusData?.payment_status_description || "Unknown",
            amount: statusData?.amount || 0,
            providerRef: transactionTrackingId || "N/A",
            payment_account: statusData?.payment_account || "N/A",
            message: statusData?.description || "No message"
        }

        Payments.findOneAndUpdate(
            { transactionTrackingId },
            { $set: { status: data.status } },
            { upsert: false, new: false }
        );
        
        // const geolocation = await getCountryFromIP(req.headers.get('x-forwarded-for') ||'');
        
        // await activateSubscription(session?.user?.id!!, transactionTrackingId, statusData, geolocation);

        return NextResponse.json(data, { status: 200 });

    } catch (error:any) {
        // await Error_Logs(req,"PLAYER_ERROR_PESAPAL_WEBHOOK_VERIFICATION", error, session?.user?.id);
        console.error("Error in Pesapal webhook:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
            
    }
}
