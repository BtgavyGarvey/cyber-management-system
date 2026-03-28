'use server'
// lib/pesapal.ts
export async function getPesapalToken() {

    try {
        
    
    const res = await fetch(`${process.env.PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consumer_key: process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
      }),
    });
    
    // console.log({res});
    
    
    if (!res.ok) throw new Error("Failed to get Pesapal token");
    const data = await res.json();
    return data.token; // depends on Pesapal response shape

} catch (error) {
        console.log({error});
}
  }
  