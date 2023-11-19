import { useEffect, useState } from "react";
import "./App.css";
import {
  approveKey,
  approvePoSTerminal,
  sendKlayTransaction,
  sendBack,
} from "./service/blockchain";
import QRCode from "react-qr-code";
import { Chains, chainConfig } from "./constants";

function App() {
  const [chain, setChain] = useState<Chains>("klaytnmainnet");
  const [cardDetails, setCardDetails] = useState<[string, string]>();
  const [hash, setHash] = useState();
  const [loading, setLoading] = useState(false);
  const chainInfo = chainConfig[chain];

  async function listen() {
    const socket = new WebSocket("ws://localhost:4000/");
    socket.onopen = function (e) {
      console.log("[open] Connection established");
    };
    socket.onmessage = function (event) {
      const { privateKey, ownerAddress } = JSON.parse(event.data);
      console.log("client received", privateKey, ownerAddress);
      setCardDetails([privateKey, ownerAddress]);
    };
  }

  useEffect(() => {
    listen();
    setCardDetails([
      "0xff4f55382dc1dad042411e64cf13eafaa051e78c9f343a3ffab8ce2408b74479",
      "0x1E117008E1a544Bbe12A2d178169136703430190",
    ]);
  }, []);

  return (
    <div className="flex min-h-screen justify-center items-center bg-gradient-to-r from-indigo-300 to-purple-400 gap-4">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body justify-center">
          <h1 className="text-3xl font-bold">Bounce.</h1>
          <div className="inline-flex gap-1">
            <div className="dropdown dropdown-hover">
              <label tabIndex={0} className="btn btn-sm">
                {chain}
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                {
                  // @ts-ignore
                  Object.entries(chainConfig).map(([chain, value]) => (
                    <li key={chain}>
                      <button
                        onClick={() => {
                          setHash(undefined);
                          setChain(chain as Chains);
                        }}
                      >
                        {value.name}
                      </button>
                    </li>
                  ))
                }
              </ul>
            </div>
            <button
              className="btn btn-sm"
              onClick={() => {
                setCardDetails(undefined);
                setHash(undefined);
                setLoading(false);
              }}
            >
              clear
            </button>
          </div>
          <p className="text-sm">Paying 10 oUSDC and Swap oUSDT</p>
          {cardDetails ? (
            <p className="text-sm truncate">Owner: {cardDetails[1]}</p>
          ) : (
            <p className="text-sm">Waiting to scan card:</p>
          )}
          <div className="divider my-0"></div>
          {hash && (
            <p className="text-sm truncate">
              hash:{" "}
              <a
                className="link link-primary"
                href={`${chainInfo.blockExplorer}${hash}`}
              >
                {hash}
              </a>
            </p>
          )}
          {loading ? (
            <span className="loading loading-spinner loading-md self-center"></span>
          ) : (
            <>
              <button
                disabled={!cardDetails}
                className="btn btn-sm"
                onClick={async () => {
                  setLoading(true);
                  setHash(undefined);
                  let hash;
                  hash = await sendKlayTransaction(
                    chain,
                    cardDetails?.[0] ?? ""
                  );
                  setLoading(false);
                  setHash(hash);
                }}
              >
                Send
              </button>
              <button
                className="btn btn-sm"
                onClick={async () => {
                  setLoading(true);
                  let hash;
                  hash = await sendBack(chain);
                  setLoading(false);
                  setHash(hash);
                }}
              >
                Send Back
              </button>

              <button
                disabled={!cardDetails}
                className="btn btn-sm"
                onClick={async () => {
                  setLoading(true);
                  setHash(undefined);
                  const hash = await approvePoSTerminal(chain);
                  setHash(hash);
                  setLoading(false);
                }}
              >
                Approve Router
              </button>
              <button
                className="btn btn-sm"
                disabled={!cardDetails}
                onClick={async () => {
                  setLoading(true);
                  setHash(undefined);
                  const hash = await approveKey(chain);
                  setHash(hash);
                  setLoading(false);
                }}
              >
                Reset Card address
              </button>
            </>
          )}
        </div>
      </div>
      {hash && (
        <div className="card bg-base-100 shadow-xl">
          {hash && (
            <div className="card-body">
              <QRCode
                size={50}
                style={{ height: "auto", maxWidth: 100, width: 100 }}
                value={chainConfig[chain].blockExplorer + hash}
                viewBox={`0 0 256 256`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
