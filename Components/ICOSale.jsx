import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { IoMdClose } from "./ReactICON";
import { LOAD_TOKEN_ICO } from "../Context/constants";
import { BUY_TOKEN } from "../Context/index";

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;

const ICOSale = ({ setLoader }) => {
  const { address } = useAccount();
  const [tokenDetails, setTokenDetails] = useState({});
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const loadToken = async () => {
      const token = await LOAD_TOKEN_ICO();
      console.log("Token details fetched:", token);
      setTokenDetails(token || {});
    };

    loadToken();
  }, [address]);

  const CALLING_FUNCTION_BUY_TOKEN = async (quantity) => {
    try {
      setLoader(true);
      console.log(quantity);

      const receipt = await BUY_TOKEN(quantity);

      if (receipt) {
        console.log(receipt);
        window.location.reload();
      }
    } catch (error) {
      console.error("Buy token failed:", error);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div
      className="modal modal--auto fade"
      id="modal-deposit1"
      tabIndex={-1}
      aria-labelledby="modal-deposit1"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal__content">
            <button
              className="modal__close"
              type="button"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <i className="ti ti-x">
                <IoMdClose />
              </i>
            </button>

            <h4 className="modal__title">
              {tokenDetails?.token?.symbol || "Token"} ICO Sale
            </h4>
            <p className="modal__text">
              Participate in the <span>Ongoing ICO token sale</span>
            </p>

            <div className="modal__form">
              <div className="form__group">
                <label className="form__label">
                  ICO Supply:{" "}
                  {`${tokenDetails?.tokenBal || 0} ${tokenDetails?.token?.symbol || "Token"}`}
                </label>
                <input
                  type="text"
                  className="form__input"
                  placeholder={`${tokenDetails?.token?.symbol || "Token"}: ${
                    tokenDetails?.token?.balance?.toString().slice(0, 12) || "0"
                  }`}
                  onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                />
              </div>

              <div className="form__group">
                <label className="form__label">Pay Amount:</label>
                <input
                  type="text"
                  className="form__input"
                  placeholder={` ${Number(tokenDetails?.tokenPrice || 0) * quantity} ${
                    CURRENCY || "Currency"
                  }`}
                  disabled
                />
              </div>

              <button
                className="form__btn"
                type="button"
                onClick={() => CALLING_FUNCTION_BUY_TOKEN(quantity)}
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ICOSale;
