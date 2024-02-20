import React, { useEffect, useState } from 'react';
import { ethers } from "ethers";
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import Token_Abi from './assets/Token.json'
import ICO_Abi from './assets/ICO.json'
import NFT_Abi from './assets/NDL.json'

// Constants
const ICO_ADDRESS = '0x30E0dA327A67B7cace39b846E21417EF379F1d9a';
const TOKEN_ADDRESS = "0x67d543237BA0db4359EEeFE9906929B197907301";
const NFT_ADDRESS = '0x609083Ea9a5DBba70B6A0A81C5eB3D9f28069E99';

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
  const [ethereumObj, setEthereum] = useState()
  const [tokenContract, setTokenContract] = useState();
  const [icoContract, setICOContract] = useState();
  const [NFTContract, setNFTContract] = useState();
  const [gasPrice, setGasprice] = useState();
  
  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const gasPrice = provider.getGasPrice();
    setGasprice(gasPrice)
    const Token = new ethers.Contract(TOKEN_ADDRESS, Token_Abi.abi, signer);
    const ICO = new ethers.Contract(ICO_ADDRESS, ICO_Abi.abi, signer);
    const NFT = new ethers.Contract(NFT_ADDRESS, NFT_Abi.abi, signer);
    setTokenContract(Token);
    setICOContract(ICO);
    setNFTContract(NFT);
    checkIfWalletIsConnected();
    getBalance();
  }, [])

  const [currentAccount, setCurrentAccount] = useState("");
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    const setEthereumObj = () => {
      return new Promise((resolve, reject) => {
        if(ethereum){
          setEthereum(ethereum)
          resolve(ethereum)
        }else{
          reject(false)
        }
      })
    }

    const flag = await setEthereumObj()

    if (!flag) {
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
      if (!ethereumObj) {
        console.log("Get Metamask");
        return;
      }
      const accounts = await ethereumObj.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
      getBalance()
    }
    catch (error) {
      console.log(error);
    }
  }

  const buyToken = async (amount) => {
    try {
      if (ethereumObj) {
        const tokenAmountInEther = (ethers.utils.parseEther((0.015 * Number(amount)).toString()));
        const options = {
          gasPrice,
          gasLimit: ethers.utils.parseUnits("200000", 0),
          value: tokenAmountInEther
        };
        console.log("tokenContract", tokenContract)
        const tx = await icoContract.buy(options);
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
      if (ethereumObj) {
        const tx = await icoContract.withdraw(ethers.utils.parseEther(amount));
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

  const withdrawERC20 = async (amount) => {
    try {
      if (ethereumObj) {
        const tx = await icoContract.withdrawERC20(ethers.utils.parseEther(amount));
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
    if(ethereumObj){
      const tokenDecimal = await tokenContract.decimals()
      const ICO_balance = await tokenContract.balanceOf(ICO_ADDRESS) / Math.pow(10, tokenDecimal)
      const Account_balance = await tokenContract.balanceOf(ethereumObj.selectedAddress) / Math.pow(10, tokenDecimal)
      setTokenBalanceAmount(ICO_balance)
      setAccBalanceAmount(Account_balance)
    }
  }

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
      withdrawToken(withdrawAmount);
      setWithdrawAmount("");
    }
    
    const handleWithdrawERC20 = async () => {
      withdrawERC20(withdrawAmount);
      setWithdrawAmount("");
    }

    return (
      <div>
        <div className='row sale-row'>
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">Withdraw Amount</span>
            </div>
            <input type="number" step="any" onChange={handleAmountInput} value={withdrawAmount} className="form-control" placeholder="Enter Amount" />
          </div>
        </div>
        <div className='row sale-row'>
          <button onClick={handleWithdraw} className="cta-button connect-wallet-button">
            Withdraw ETC
          </button>
          <button onClick={handleWithdrawERC20} className="cta-button connect-wallet-button">
            Withdraw MinnalX01
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

  const SaleNFT = () => {
    const mint = async () => {
      const tokenURI = "https://white-progressive-moose-640.mypinata.cloud/ipfs/QmY5DeDf9dyFokXuX7kjgrC1WkKDeTLEEf3U7eCYw1DLjW/5.jpg"
      console.log("NFT_contract", NFTContract)
      const options = {
        gasPrice,
        gasLimit: ethers.utils.parseUnits("500000", 0),
      }
      const tx = NFTContract.mint(ethereumObj.selectedAddress, tokenURI ,options)
      console.log(tx)
    }

    const purchaseLicense = async () => {
      console.log("NFTContract", NFTContract)
      const options = {
        value:ethers.utils.parseEther("5.68"),
        gasPrice,
        gasLimit: ethers.utils.parseUnits("500000", 0),
      }
      const tx = await NFTContract.purchaseLicense(0 ,options)
      const result = await tx.wait()
      console.log("result", result)
    }

    return (
      (currentAccount === "") ? (
        ""
      ) : (
        <div className="col-lg-6">
          <div className="saleCard">
            <div className='row sale-row'>
              <button onClick={mint} className="cta-button connect-wallet-button">
                NFT MINT
              </button>
              <button onClick={purchaseLicense} className="cta-button connect-wallet-button">
                PurchaseLicense
              </button>
            </div>
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
        {SaleNFT()}

      </div>
      {Footer()}
    </div>
  );
};

export default App;