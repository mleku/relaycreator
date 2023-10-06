import LNBits from 'lnbits'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import prisma from '../../../lib/prisma'

export default async function handle(req: any, res: any) {
    const session = await getServerSession(req, res, authOptions)
    if (session) {
        // Signed in
        console.log("Session", JSON.stringify(session, null, 2))
    } else {
        // Not Signed in
        //res.status(404).json({ "error": "not signed in" })
        //res.end()
        //return
    }

    const { relayname, pubkey } = req.query as { relayname: string, pubkey: string };

    if (pubkey == null) {
        res.status(404).json({ "error": "not signed in or no pubkey" })
        res.end()
        return
    }

    const myUser = await prisma.user.findFirst({ where: { pubkey: pubkey } })

    var useUser

    if (!myUser) {
        useUser = await prisma.user.create({
            data: {
                pubkey: pubkey,
            },
        })
    } else {
        useUser = myUser
    }

    if (relayname == null || relayname == "") {
        res.status(404).json({ "error": "enter a relay name" })
        return
    }

    // check if relay already exists, or can be reserved
    const r = await prisma.relay.findFirst({ where: { name: relayname } })

    if (r != null) {
        res.status(404).json({ "error": "relay name already exists" })
        return
    }


    if (!process.env.LNBITS_ADMIN_KEY || !process.env.LNBITS_INVOICE_READ_KEY || !process.env.LNBITS_ENDPOINT) {
        console.log("ERROR: no LNBITS env vars")
        if (process.env.PAYMENTS_ENABLED == "true") {
            res.status(500).json({ "error": "payments enabled, but no lnbits vars found" })
            return
        }
    }

    let useAmount = 21
    if (process.env.INVOICE_AMOUNT != null) {
        useAmount = parseInt(process.env.INVOICE_AMOUNT)
    }

    // find a free port
    const allRelays = await prisma.relay.findMany({
        where: {
            domain: "nostr1.com"
        },
        select: { "port": true }
    })

    let p = 0
    allRelays.forEach((r: any) => {
        if (r.port > p) {
            p = r.port
        }
    })
    p = p + 1

    var currentdate = new Date();
    // create relay with user association
    let useStatus = null;
    if (process.env.PAYMENTS_ENABLED != "true") {
        useStatus = "provision"
    }
    const relayResult = await prisma.relay.create({
        data: {
            name: relayname,
            ownerId: useUser.id,
            domain: "nostr1.com",
            created_at: currentdate,
            status: useStatus,
            port: p,
        }
    })
    const newbl = await prisma.blockList.create({
        data: {
            relayId: relayResult.id,
        }
    })
    const newal = await prisma.allowList.create({
        data: {
            relayId: relayResult.id,
        }
    })
    if (!relayResult) {
        res.status(404).json({ "error": "relay creation failed" })
        return
    }

    if (process.env.PAYMENTS_ENABLED == "true" && process.env.LNBITS_ADMIN_KEY && process.env.LNBITS_INVOICE_READ_KEY && process.env.LNBITS_ENDPOINT) {
        const { wallet } = LNBits({
            adminKey: process.env.LNBITS_ADMIN_KEY,
            invoiceReadKey: process.env.LNBITS_INVOICE_READ_KEY,
            endpoint: process.env.LNBITS_ENDPOINT,
        });

        const newInvoice = await wallet.createInvoice({
            amount: useAmount,
            memo: relayname + " " + pubkey,
            out: false,
        });

        const orderCreated = await prisma.order.create({
            data: {
                relayId: relayResult.id,
                userId: useUser.id,
                status: "pending",
                paid: false,
                payment_hash: newInvoice.payment_hash,
                lnurl: newInvoice.payment_request,
            }
        })
        res.status(200).json({ order_id: orderCreated.id });
    } else {
        const orderCreated = await prisma.order.create({
            data: {
                relayId: relayResult.id,
                userId: useUser.id,
                status: "paid",
                paid: true,
                payment_hash: "0000",
                lnurl: "0000",
            }
        })

        res.status(200).json({ order_id: orderCreated.id });

    }


}