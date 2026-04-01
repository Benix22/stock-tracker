import { getEurostatBatch } from "./src/actions/eurostat";

async function testSpainBalanza() {
    console.log("=== SPAIN BALANZA TEST (bop_c6_m) ===");
    const results = await getEurostatBatch("bop_c6_m", { 
        geo: 'ES', 
        bop_item: 'GS', 
        stk_flow: 'BAL', 
        unit: 'MIO_EUR', 
        partner: 'WORLD' 
    });
    console.log("Spain Balanza (MIO_EUR):", results['ES']);
}

testSpainBalanza();
