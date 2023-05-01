"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";

type ListEntryPubkey = {
    pubkey: string;
    reason: string | null;
    id: string,
}

export default function ListEntryPubkeys(props: React.PropsWithChildren<{
    pubkeys: ListEntryPubkey[];
    kind: string;
    relay_id: string;
}>) {

    const [pubkey, setPubkey] = useState("");
    const [reason, setReason] = useState("");
    const [newpubkey, setNewPubkey] = useState(false);

    const router = useRouter();

    let idkind = ""
    if (props.kind == "Whitelisted pubkeys") {
        idkind = "whitelist"
    } else {
        idkind = "blacklist"
    }

    const handleDelete = async (event: any) => {
        event.preventDefault();
        console.log(event.currentTarget.id)
        // call to API to delete keyword
        const response = await fetch(`/api/relay/${props.relay_id}/${idkind}pubkey?list_id=${event.currentTarget.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });
        router.push(`/curator?relay_id=${props.relay_id}`)
    }

    const handleSubmit = async (event: any) => {
        event.preventDefault();
        const id = event.currentTarget.id
        console.log(event.currentTarget.id)
        // call to API to add new keyword
        const response = await fetch(`/api/relay/${props.relay_id}/${idkind}pubkey`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "pubkey": pubkey, "reason": reason })
        });
        if (response.ok) {
            setNewPubkey(false)
            router.push(`/curator?relay_id=${props.relay_id}`)
        }
    }

    const handleCancel = async () => {
        setNewPubkey(false)
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-0">
                                        {props.kind}
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">
                                        Reason
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Edit</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {props.pubkeys.map((entry) => (
                                    <tr key={entry.pubkey}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-0">
                                            {entry.pubkey}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{entry.reason}</td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right">

                                            <button onClick={handleDelete} className="btn btn-secondary" id={entry.id}>Delete</button>
                                        </td>
                                    </tr>
                                ))}

                                {newpubkey &&

                                    <tr>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-0">
                                            <form className="space-y-6" action="#" method="POST">
                                                <input
                                                    type="text"
                                                    name="pubkey"
                                                    id={idkind + "newpubkey"}
                                                    className="input input-bordered input-primary w-full max-w-xs"
                                                    placeholder="add pubkey"
                                                    value={pubkey}
                                                    onChange={event => setPubkey(event.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    name="reason"
                                                    id={idkind + "newreason"}
                                                    className="input input-bordered input-primary w-full max-w-xs"
                                                    placeholder="add reason"
                                                    value={reason}
                                                    onChange={event => setReason(event.target.value)}
                                                />
                                                <button onClick={handleSubmit} className="btn btn-primary">Add</button>
                                                <button onClick={handleCancel} className="btn btn-primary">Cancel</button>
                                            </form>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
            {!newpubkey &&
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        onClick={() => setNewPubkey(true)}
                        type="button"
                        className="btn btn-primary"
                    >
                        Add pubkey
                    </button>
                </div>
            }
        </div>
    )
}