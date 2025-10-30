import { useState } from "react";

function TransferCredits({ transfers, setTransfers }) {
	const addTransfer = () => {
		setTransfers([...transfers, { id: Date.now(), school: "", credits: 0 }]);
	};

	const updateTransfer = (id, field, value) => {
		setTransfers(
			transfers.map((t) => (t.id === id ? { ...t, [field]: value } : t))
		);
	};

	const removeTransfer = (id) => {
		setTransfers(transfers.filter((t) => t.id !== id));
	};

	const totalCredits = transfers.reduce(
		(sum, t) => sum + (parseFloat(t.credits) || 0),
		0
	);

  return (
    <section className="mb-8 ">
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-300 overflow-hidden max-w-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Transfer Work</h2>
          <button
            onClick={addTransfer}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
            Add Transfer
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide w-[65%]">
                  Transferred School
                </th>
                <th className="p-3 text-center text-xs font-semibold uppercase tracking-wide w-[30%] white-space-nowrap">
                  Earned Credits
                </th>
                <th className="p-3 text-center text-xs font-semibold uppercase tracking-wide w-[5%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfers.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    className="p-4 text-center text-gray-500 italic"
                  >
                    No transfer credits. Click "Add Transfer" to add a school.
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr key={transfer.id}>
                    <td className="p-2 w-[60%]">
                      <input
                        type="text"
                        value={transfer.school}
                        onChange={(e) =>
                          updateTransfer(
                            transfer.id,
                            "school",
                            e.target.value.toUpperCase()
                          )
                        }
                        className="w-full p-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-transparent transition-all uppercase"
                        placeholder="SCHOOL NAME"
                        style={{ textTransform: "uppercase" }}
                      />
                    </td>
                    <td className="p-2 w-[30%]">
                      <input
                        type="number"
                        value={transfer.credits || ""}
                        onChange={(e) =>
                          updateTransfer(
                            transfer.id,
                            "credits",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full p-2 text-sm text-center rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-transparent transition-all"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="p-2 text-center w-[10%]">
                      <button
                        onClick={() => removeTransfer(transfer.id)}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default TransferCredits;
