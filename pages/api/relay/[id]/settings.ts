import prisma from '../../../../lib/prisma'
import { checkSessionForRelay } from "../../../../lib/checkSessionForRelay"
import { getSession } from 'next-auth/react'

export default async function handle(req: any, res: any) {
    // check owner and relay, to create blank BlockList
    const session = await getSession({ req });

    const isMyRelay = await checkSessionForRelay(req, res)
    if (isMyRelay == null) {
        res.status(500).json({ "error": "unauthorized" })
        return
    }

    if (req.method == "POST") {
        const { default_message_policy } = req.body;
        const update = await prisma.relay.update({
            where: {
                id: isMyRelay.id,
            },
            data: {
                default_message_policy: default_message_policy,
            }
        })
    } else {
        res.status(500).json({ "error": "method not allowed" })
        return
    }
    res.status(200).json({});
}