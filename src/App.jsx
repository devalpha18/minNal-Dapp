import React, { useEffect, useState } from 'react';
import { ethers } from "ethers";
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import ICO_Abi from './assets/ICO.json'
import Token_Abi from './assets/Token.json'

// Constants
const ICO_ADDRESS = '0x76B4084209Eb15754983788bd8e3cb0E9c631b3A';
const TOKEN_ADDRESS = "0x9Ab5c04Ef221ee48f344C114f2233fA4ee896fc2";

const Footer = () => {
  return (
    <div className="footer-container">
      <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
    </div>
  );
}

const App = () => {
  const [accBalanceAmount, setAccBalanceAmount] = useState();
  const [tokenBalanceAmount, setTokenBalanceAmount] = useState();
  
  useEffect(() => {
    checkIfWalletIsConnected();
    getBalance();
  }, [])

  const [currentAccount, setCurrentAccount] = useState("");
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have metamask");
      return;
    }
    else {
      console.log("We have a ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length != 0) {
      const account = accounts[0]
      setCurrentAccount(account);
    }
    else {
      console.log("Could not find authorized account");
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Get Metamask");
        return;
      }
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
    }
    catch (error) {
      console.log(error);
    }
  }

  const buyToken = async (amount) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const Token = new ethers.Contract(ICO_ADDRESS, ICO_Abi.abi, signer);
        const tokenAmountInEther = (ethers.utils.parseEther((0.015 * Number(amount)).toString()));
        const gasPrice = await provider.getGasPrice();
        const options = {
          gasPrice,
          gasLimit: ethers.utils.parseUnits("200000", 0),
          value: tokenAmountInEther
        };
        const tx = await Token.buy(options);
        const result =  await tx.wait();
        console.log(result)
        if(result.confirmations) getBalance()
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    }

    catch (error) {
      console.log(error)
    }
  }

  const withdrawToken = async (amount) => {
    try {
      const { ethereum } = window;
    
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const Token = new ethers.Contract(ICO_ADDRESS, ICO.abi, signer);
        const tokenAmountInEther = ethers.utils.parseEther((0.015 * Number(amount)).toString());
        console.log("tokenAmountInEther", tokenAmountInEther)
        const gasPrice = await provider.getGasPrice();
        const options = {
          gasPrice,
          gasLimit: 300000, // Set gas limit as a number
          value: tokenAmountInEther
        };
        console.log("options", options)
        const tx = await Token.withdraw(ethers.utils.parseEther(amount)).wait();
        const result =  await tx.wait();
        if(result.confirmations) getBalance()
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    }
    
    catch (error) {
      console.log(error)
    }
  }

  const getBalance = async () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, Token_Abi.abi, signer);
    const tokenDecimal = await tokenContract.decimals()
    const ICO_balance = await tokenContract.balanceOf(ICO_ADDRESS) / Math.pow(10, tokenDecimal)
    const Account_balance = await tokenContract.balanceOf(ethereum.selectedAddress) / Math.pow(10, tokenDecimal)
    console.log("ICO_balance, Account_balance", ICO_balance, Account_balance)
    setTokenBalanceAmount(ICO_balance)
    setAccBalanceAmount(Account_balance)
  }

  // Render Methods
  const Wallet = () => {
    return (  
      currentAccount === "" ? (
        <button onClick={connectWallet} className="cta-button connect-wallet-button">
          Connect Wallet
        </button>
      ) : (
        <div>
          <p className='wallet-address'><span className='bold'>Connected:</span> {currentAccount}</p>
        </div>
      )
    );
  }

  const Buy = (props) => {
    const [tokenAmount, setTokenAmount] = useState("");

    const handleAmountInput = (e) => {
      setTokenAmount(e.target.value);
    }

    const handleBuy = async () => {
      if (tokenAmount >= props.min && tokenAmount <= props.max) {
        await buyToken(tokenAmount);
        setTokenAmount("");
      }
      
    }

    return (
      <div>
        <div className='row sale-row'>
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">TEST Token</span>
            </div>

            <input type="number" min={props.min} max={props.max} step="100" onChange={handleAmountInput} value={tokenAmount} className="form-control" placeholder="Enter Amount" />

          </div>
        </div>

        <div className='row sale-row'>
          <button onClick={handleBuy} className="cta-button connect-wallet-button">
            Buy TEST_TOKEN
          </button>
        </div>
      </div>
    );
  }

  const Withdraw = () => {
    const [withdrawAmount, setWithdrawAmount] = useState("");

    const handleAmountInput = (e) => {
      setWithdrawAmount(e.target.value);
    }

    const handleWithdraw = async () => {
      await withdrawToken(withdrawAmount);
      await getBalance();
      setWithdrawAmount("");
    }

    return (
      <div>
        <div className='row sale-row'>
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">TEST Token</span>
            </div>
            <input type="number" onChange={handleAmountInput} value={withdrawAmount} className="form-control" placeholder="Enter Amount" />
          </div>
        </div>

        <div className='row sale-row'>
          <button onClick={handleWithdraw} className="cta-button connect-wallet-button">
            Withdraw TEST_TOKEN
          </button>
        </div>
      </div>
    );
  }

  const SaleCard = () => {
    return (
      (currentAccount === "") ? (
        ""
      ) : (
        <div className="col-lg-6">
          <div className="saleCard">
            <div className='row sale-row'>
              <p className='saleDesc'>Account Balance: <span className="saleDescVal">{accBalanceAmount}</span></p>
              <p className='saleDesc'>Token Name: <span className="saleDescVal">TEST TOKEN</span></p>
              <p className='saleDesc'>Available Token Balanace: <span className="saleDescVal">{tokenBalanceAmount}</span></p>
              <p className='saleDesc'>Price: <span className="saleDescVal">1 TEST = 0.015 METC</span></p>
            </div>
            <Buy min={100} max={500} />
            <Withdraw />
          </div>
        </div>
      )
    );
  }



  return (
    <div className="App container-fluid">
      <nav className="navbar">
        <div className="header-container">
          <p className="header gradient-text">TestToken</p>
        </div>
        <div className="wallet-container">
          {Wallet()}
        </div>
      </nav>

      <div className="row app-row app-container">
        <div className="col-lg-6">
          <p className="sub-text">
            Buy TestToken Now, To Get Rich In The Future.
          </p>

          <p className="sub-sub-text">
          TestToken is more than just a Defi Token. It's the best DeFi Token and you can learn here about this crypto
          </p>

        </div>

        {SaleCard()}

        {Footer()}

      </div>
    </div>
  );
};

export default App;