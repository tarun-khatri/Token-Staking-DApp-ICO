import { BigNumber, ethers, utils } from "ethers";
import toast from "react-hot-toast";
import {contract, tokenContract, ERC20, toEth, TOKEN_ICO_CONTRACT} from "./constants";

const STAKING_DAPP_ADDRESS = process.env.NEXT_PUBLIC_STAKING_DAPP;

const DEPOSIT_TOKEN = process.env.NEXT_PUBLIC_DEPOSIT_TOKEN;
const REWARD_TOKEN = process.env.NEXT_PUBLIC_REWARD_TOKEN;
const TOKEN_LOGO = process.env.NEXT_PUBLIC_TOKEN_LOGO;

const notifySuccess = (msg) => toast.success(msg, {duration:2000});
const notifyError = (msg) => toast.error(msg, {duration:2000});

function CONVERT_TIMESTAMP_TO_READABLE(timestamp){
    const date = new Date(timestamp * 100);

    const readableTime = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    return readableTime;
}

function toWei(amount){
    const toWei = ethers.utils.parseUnits(amount.toString());
    return toWei.toString();
}

function parseError(e){
    const json = JSON.parse(JSON.stringify(e));
    return json?.reason || json?.error?.message;
}

export const SHORTEN_ADDRESS = (address) =>`${address?.slice(0,8)}...${address?.slice(address.length - 4)}`;

export const copyAddress = (text) =>{
    navigator.clipboard.writeText(text);
    notifySuccess("Copied Successfully");
}

export async function CONTRACT_DATA(address) {
  try {
    const contractObj = await contract();
    const stakingTokenObj = await tokenContract();

    if (address) {
      const contractOwner = await contractObj.owner();
      const contractAddress = await contractObj.address;

      const notifications = await contractObj.getNotifications();
      const _notificationsArray = await Promise.all(
        notifications.map(
          async ({ poolID, amount, user, typeOf, timestamp }) => {
            return {
              poolID: poolID.toNumber(),
              amount: toEth(amount),
              user: user,
              typeOf: typeOf,
              timestamp: CONVERT_TIMESTAMP_TO_READABLE(timestamp),
            };
          }
        )
      );

      let poolInfoArray = [];
      const poolLength = await contractObj.poolCount();
      const length = poolLength.toNumber();

      for (let i = 0; i < length; i++) {
        const poolInfo = await contractObj.poolInfo(i);
        const userInfo = await contractObj.userInfo(i, address);
        const userReward = await contractObj.pendingReward(i, address);
        const tokenPoolInfoA = await ERC20(poolInfo.depositToken, address);
        const tokenPoolInfoB = await ERC20(poolInfo.rewardToken, address);

        const pool = {
          depositTokenAddress: poolInfo.depositToken,
          rewardTokenAddress: poolInfo.rewardToken,
          depositToken: tokenPoolInfoA,
          rewardToken: tokenPoolInfoB,
          // Use the raw value returned by the contract.
          // Make sure poolInfo.depositedAmount exists (it does per your contract).
          depositedAmount: toEth(poolInfo.depositedAmount.toString()),
          apy: poolInfo.apy.toString(),
          lockDays: poolInfo.lockDays.toString(),

          amount: toEth(userInfo.amount.toString()),
          userReward: toEth(userReward),
          lockUntil: CONVERT_TIMESTAMP_TO_READABLE(userInfo.lockUntil.toNumber()),
          lastRewardAt: toEth(userInfo.lastRewardAt.toString()),
        };

        poolInfoArray.push(pool);
      }

      // Calculate totalDepositAmount (ensure you're summing, not multiplying)
      const totalDepositAmount = poolInfoArray.reduce((total, pool) => {
        return total + parseFloat(pool.depositedAmount);
      }, 0);

      const rewardToken = await ERC20(REWARD_TOKEN, address);
      const depositToken = await ERC20(DEPOSIT_TOKEN, address);

      // --- New Code for Converting the Balance ---
      // Assume depositToken.contractTokenBalance is a human-readable string like "100.0".
      // We need to convert it back to its raw value, subtract the total deposit, then format it.
      const decimals = depositToken.decimals || 18; // Use the token's decimals if available
      let formattedContractTokenBalance = "0";
      try {
        // Convert the human-readable string to a BigNumber in raw units
        const rawDepositTokenBalance = utils.parseUnits(
          depositToken.contractTokenBalance.toString(),
          decimals
        );
        // Convert totalDepositAmount (also human-readable) to raw units
        const rawTotalDepositAmount = utils.parseUnits(
          totalDepositAmount.toString(),
          decimals
        );
        // Subtract
        const rawRemaining = rawDepositTokenBalance.sub(rawTotalDepositAmount);
        // Format it back to a human-readable string
        formattedContractTokenBalance = utils.formatUnits(rawRemaining, decimals);
      } catch (error) {
        console.error("Error converting contract token balance:", error);
      }
      // --- End of New Code ---

      const data = {
        contractOwner: contractOwner,
        contractAddress: contractAddress,
        notifications: _notificationsArray.reverse(),
        rewardToken: rewardToken,
        depositToken: depositToken,
        poolInfoArray: poolInfoArray,
        totalDepositAmount: totalDepositAmount,
        contractTokenBalance: formattedContractTokenBalance,
      };
      return data;
    }
  } catch (error) {
    console.log(error);
    console.log(parseError(error));
    return parseError(error);
  }
}


export async function deposit(poolID, amount, address) {
    try {
      notifySuccess("Calling contract....");
  
      const contractObj = await contract();
      const stakingTokenObj = await tokenContract();
  
      const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);
  
      const currentAllowance = await stakingTokenObj.allowance(
        address,
        contractObj.address
      );
  
      if (currentAllowance.lt(amountInWei)) {
        notifySuccess("Approving token...");
        const approveTx = await stakingTokenObj.approve(
          contractObj.address,
          amountInWei
        );
        await approveTx.wait();
      }
  
      const gasEstimation = await contractObj.estimateGas.deposit(
        Number(poolID),
        amountInWei
      );
  
      notifySuccess("Staking token call...");
      const stakeTx = await contractObj.deposit(poolID, amountInWei, {
        gasLimit: gasEstimation,
      });
  
      const receipt = await stakeTx.wait();
      notifySuccess("Token stake successfully");
      return receipt;
    } catch (error) {
      console.log(error);
      const errorMsg = parseError(error);
      notifyError(errorMsg);
    }
  }
  

export async function transferToken(amount, transferAddress) {
    try {
        notifySuccess("Calling contract token...")

        const stakingTokenObj = await tokenContract();

        const transferAmount = ethers.utils.parseEther(amount);

        const approveTx = await stakingTokenObj.transfer(transferAddress, transferAmount);

        const receipt = await approveTx.wait();

        notifySuccess("Token transfer succesfully");
        return receipt;
    } catch (error) {
     console.log(error);
     const errorMsg = parseError(error);
     notifyError(errorMsg);   
    }
}

export async function withdraw(poolID, amount) {
    try {
        notifySuccess("Calling contract...");

        const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);

        const contractObj = await contract();

        const gasEstimation = await contractObj.estimateGas.withdraw(
            Number(poolID),
            amountInWei
        )

        const data = await contractObj.withdraw(Number(poolID), amountInWei, {
            gasLimit: gasEstimation
        })

        const receipt = await data.wait();
        notifySuccess("Transactions successfully completed");
        return receipt;

    } catch (error) {
        console.log(error);
     const errorMsg = parseError(error);
     notifyError(errorMsg);
    }
}


export async function claimReward(poolID) {
    try {
        notifySuccess("Calling contract...");
        const contractObj = await contract();

        const gasEstimation = await contractObj.estimateGas.claimReward(
            Number(poolID),
        )

        const data = await contractObj.claimReward(Number(poolID), {
            gasLimit: gasEstimation
        });

        const receipt = await data.wait();
        notifySuccess("Reward claimed")
        return receipt;


    } catch (error) {
        console.log(error);
    const errorMsg = parseError(error);
    notifyError(errorMsg);
    }
        
}

export async function createPool(pool) {
    try {
        const {_depositToken, _rewardToken, _apy, _lockDays} = pool;

        if (!_apy || !_depositToken || !_lockDays || !_rewardToken) {
            return notifyError("Provide all the details")
        }

        notifySuccess("Calling contract");

        const contractObj =await contract();

        const gasEstimation = await contractObj.estimateGas.addPool(
            _depositToken,
            _rewardToken,
            Number(_apy),
            Number(_lockDays)
        );

        const stakeTx = await contractObj.addPool(
            _depositToken,
            _rewardToken,
            Number(_apy),
            Number(_lockDays),
            {
                gasLimit: gasEstimation
            }
        )

        const receipt = await stakeTx.wait();
        notifySuccess("Pool created successfully");
        return receipt
    } catch (error) {
        console.log(error);
        const errorMsg = parseError(error);
        notifyError(errorMsg);
    }
}

export async function modifyPool(poolID, amount) {
    try {
        notifySuccess("Calling contract...");
        const contractObj = await contract();

        const gasEstimation = await contractObj.estimateGas.modifyPool(
            Number(poolID),
            Number(amount),
        )

        const data = await contractObj.modifyPool(Number(poolID), Number(amount), {
            gasLimit: gasEstimation,
        })

        const receipt = await data.wait();
        notifySuccess("Modified successfully");
        return receipt;

    } catch (error) {
        console.log(error);
        const errorMsg = parseError(error);
        notifyError(errorMsg);
    }
}

export async function sweep(tokenData) {
    try {
        const {token, amount} =tokenData;
        if (!token || !amount) {
            return notifyError("Data is missing");
        }

        notifySuccess("Calling contract...");
        const contractObj = await contract();

        const transferAmount = ethers.utils.parseEther(amount);

        const gasEstimation = await contractObj.estimateGas.sweep(
            token, transferAmount
        )

        const data = await contractObj.sweep(token, transferAmount, {
            gasLimit: gasEstimation,
        })

        const receipt = await data.wait();
        notifySuccess("Tranaction succesfull");
        return receipt;

    } catch (error) {
        console.log(error);
        const errorMsg = parseError(error);
        notifyError(errorMsg);
    }
}

//ADD TOkEN TO METAMASK

export const addTokenMetaMask = async (token) => {
    if (window.ethereum) {
        const contract =await tokenContract();

        const tokenDecimals = await contract.decimals();
        const tokenAddress = await contract.address;
        const tokenSymbol = await contract.symbol();
        const tokenImage = TOKEN_LOGO;

        try {
            const wasAdded = await window.ethereum.request({
                method:"wallet_watchAsset",
                params:{
                    type: "ERC20",
                    options:{
                        address: tokenAddress,
                        symbol: tokenSymbol,
                        decimals: tokenDecimals,
                        image: tokenImage
                    },
                },
            });

            if (wasAdded) {
                notifySuccess("Token Added")
            } else{
                notifyError("Failed to add token")
            }
        } catch (error) {
            notifyError("Failed to add token")
        }
    }else{
        notifyError("Metamask is not installed")
    }
}

//ICO CONTRACT

export const BUY_TOKEN = async (amount) => {
    try {
        notifySuccess("Calling ICO Contract")
        const contract = await TOKEN_ICO_CONTRACT();

        const tokenDetails = await contract.gettokenDetails();
        const availableToken = ethers.utils.formatEther(
            tokenDetails.balance.toString()
        );

        if (availableToken > 1) {
            const price = ethers.utils.formatEther(tokenDetails.tokenPrice.toString()) * Number(amount);

            const payAmount = ethers.utils.parseUnits(price.toString(), "ether");

            const transaction = await contract.buyToken(Number(amount), {
                value: payAmount.toString(),
                gasLimit: ethers.utils.hexlify(8000000),
            });

            const receipt = await transaction.wait();

            notifySuccess("Transaction successfully completed");
            return receipt;
        } else{
            notifyError("Token balance is lower than expected");
            return "receipt"
        }
        
    } catch (error) {
        const errorMsg = parseError(error);
        notifyError(errorMsg)
    }
}

export const TOKEN_WITHDRAW = async () => {
    try {
        notifySuccess("Calling ICO Contract")
        const contract = await TOKEN_ICO_CONTRACT();

        const tokenDetails = await contract.gettokenDetails();
        const availableToken = ethers.utils.formatEther(
            tokenDetails.balance.toString()
        );

        if (availableToken > 1) {

            const transaction = await contract.withdrawAllTokens();

            const receipt = await transaction.wait();

            notifySuccess("Transaction successfully completed");
            return receipt;
        } else{
            notifyError("Token balance is lower than expected");
            return "receipt"
        }

    } catch (error) {
        const errorMsg = parseError(error);
        notifyError(errorMsg)
    }
}

export const UPADTE_TOKEN = async (_address) => {
    try {
        if (!_address) {
            notifyError ("Data is missing")
        }
        notifySuccess("Calling contract");

        const contract = await TOKEN_ICO_CONTRACT();

        const gasEstimation = await contract.estimateGas.updateToken(_address);

        const transaction = await contract.updateToken(_address, {
            gasLimit: gasEstimation,
        })

        const receipt = await transaction.wait();

        notifySuccess("Transaction successfully completed");
        return receipt;
    } catch (error) {
        console.log(error)
        const errorMsg = parseError(error);
        notifyError(errorMsg)
    }
}
export const UPADTE_TOKEN_PRICE = async (price) => {
    try {
        if (!price) {
            notifyError ("Data is missing")
        }
        notifySuccess("Calling contract");

        const contract = await TOKEN_ICO_CONTRACT();

        const payAmount = ethers.utils.parseUnits(price.toString(), "ether");

        const gasEstimation = await contract.estimateGas.updateTokenSalePrice(
            payAmount
        );

        const transaction = await contract.updateTokenSalePrice(payAmount, {
            gasLimit: gasEstimation
        })

        const receipt = await transaction.wait();

        notifySuccess("Transaction successfully completed");
        return receipt;

    } catch (error) {
        console.log(error)
        const errorMsg = parseError(error);
        notifyError(errorMsg)
    }
}