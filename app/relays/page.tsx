import { getServerSession } from "next-auth/next"
import authOptions from "../../pages/api/auth/[...nextauth]"
import prisma from '../../lib/prisma'
import PublicRelays from "./publicRelays"
import MyRelays from "./myRelays"
import CreateRelay from "./createRelay"
import HelpfulInfo from "./helpfulInfo"

export default async function Relays() {
    const session = await getServerSession(authOptions)

    const publicRelays = await prisma.relay.findMany({
        where: {
            status: "running",
            listed_in_directory: true,
        },
        include: {
            owner: true,
            moderators: {
                include: { user: true },
            },
            block_list: {
                include: {
                    list_keywords: true,
                    list_pubkeys: true,
                },
            },
            allow_list: {
                include: {
                    list_keywords: true,
                    list_pubkeys: true,
                },
            },
        }
    })

    let showSignup = false

    if (!session || !(session as any).user.name) {
        return (
            <div>

                {showSignup && <CreateRelay />}
                {!showSignup && <HelpfulInfo />}

                <PublicRelays relays={publicRelays} />

            </div>
        )
    }

    const me = await prisma.user.findFirst({
        where: {
            pubkey: (session as any).user.name
        },
    })

    // not likely, since we're logged in
    if (me == null) {
        return (
            <div>user not found?</div>
        )
    }

    const myRelays = await prisma.relay.findMany({
        where: {
            ownerId: me.id,
            OR: [
                { status: "running" },
                { status: "provision" },
            ]
        },
        include: {
            owner: true,
            moderators: {
                include: { user: true },
            },
            block_list: {
                include: {
                    list_keywords: true,
                    list_pubkeys: true,
                },
            },
            allow_list: {
                include: {
                    list_keywords: true,
                    list_pubkeys: true,
                },
            },
        }
    })

    const moderatedRelays = await prisma.moderator.findMany({
        where: {
            userId: me.id,
        },
        include: {
            relay: {
                include: {
                    owner: true,
                    moderators: {
                        include: { user: true },
                    },
                    block_list: {
                        include: {
                            list_keywords: true,
                            list_pubkeys: true,
                        },
                    },
                    allow_list: {
                        include: {
                            list_keywords: true,
                            list_pubkeys: true,
                        },
                    },
                }
            }
        }
    })


    if (myRelays.length == 0 && moderatedRelays.length == 0) {
        showSignup = false
    }

    return (

        <div className="font-jetbrains flex flex-col justify-center items-center">
            {showSignup && <CreateRelay />}
            {!showSignup && <HelpfulInfo />}
            <MyRelays myRelays={myRelays} moderatedRelays={moderatedRelays} publicRelays={publicRelays} />
        </div>
    )
}