import React, { useEffect, useState } from 'react';
import { ethers } from "ethers";
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import Token_Abi from './assets/Token.json'
import ICO_Abi from './assets/ICO.json'
import NFT_Abi from './assets/NDL.json'

// Constants
const ICO_ADDRESS = '0x30E0dA327A67B7cace39b846E21417EF379F1d9a';
const TOKEN_ADDRESS = "0x0c7Bb185696eC8aF91538b893852B06248BDe9aF";
const NFT_ADDRESS = '0x621c7219a1E090703F1fE0BB1cace9bc8b82493e';

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
  const [ETCPrice, setETCPrice] = useState();
  const [currentMintId, setCurrentMintId] = useState();
  const [currentBuyId, setCurrentBuyId] = useState()
  const [initialNFT, setInitialNFT] = useState()
  const [currentAccount, setCurrentAccount] = useState("");
  
  useEffect(() => {
    const coingeckoApiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum-classic&vs_currencies=usd';
    fetch(fetch(coingeckoApiUrl)
    .then(response => response.json())
    .then(data => {
        const etcPrice = data['ethereum-classic'].usd;
        console.log(`Current ETC Price: $${etcPrice}`);
        setETCPrice(etcPrice);
    })
    .catch(error => {
        console.error('Error fetching ETC price:', error);
    }))

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    provider.getGasPrice().then(res => {
      setGasprice(res)
    });
    const Token = new ethers.Contract(TOKEN_ADDRESS, Token_Abi.abi, signer);
    const ICO = new ethers.Contract(ICO_ADDRESS, ICO_Abi.abi, signer);
    const NFT = new ethers.Contract(NFT_ADDRESS, NFT_Abi.abi, signer);
    setTokenContract(Token);
    setICOContract(ICO);
    setNFTContract(NFT);
    checkIfWalletIsConnected();
    getBalance();
    getMintId();
    getBuyId();
  }, [])

  useEffect(() => {
    getInitialNFTData()
  }, [NFTContract])

  useEffect(() => {
    console.log("currentMintId,currentBuyId", currentMintId,currentBuyId)
  }, [currentMintId,currentBuyId])

  const getInitialNFTData = async () => {
    const balanceNFT = await NFTContract.balanceOf(NFT_ADDRESS);
    console.log("balanceNFT", balanceNFT.toString())
    let tokenUris = [];
    for(let i = 0; i < balanceNFT; i++){
      tokenUris[i] = await NFTContract.tokenURI(i);
    }
    setInitialNFT(tokenUris)
    console.log("tokenUris", tokenUris)
  }
  const getMintId = async () => {
    const mindId = await NFTContract.getMintId();
    setCurrentMintId(mindId.toString())
    console.log("mindId", mindId.toString())
  }

  const getBuyId = async () => {
    const buyId = await NFTContract.getBuyId()
    setCurrentBuyId(buyId.toString())
    console.log("buyId", buyId.toString())
  }

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
        <div className="col-lg-5">
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
    const [purchaseAmount, setPurchaseAmount] = useState()
    const [mintAmount, setMintAmount] = useState()
    const getETCAmont  = () => {
      const tokenPrice = 0.2;
      const lisencePrice = purchaseAmount != 10 ? 150 * purchaseAmount : 1350;
      const lisenceETCAll = lisencePrice / ETCPrice;
      const lisenceETC = (( lisencePrice / 10 ) * 7) / ETCPrice;
      const lisenceToken = ((( lisencePrice / 10 ) * 3) / ETCPrice) /  tokenPrice;
      const data = {
        lisenceETCAll,
        lisenceETC,
        lisenceToken
      }
      return data;
    }

    const mint = async () => {
      const tokenbaseURI = "https://white-progressive-moose-640.mypinata.cloud/ipfs/QmXknt9KKKFTqkwqUnnM3RTrsRhvwKXXRNKAXwDWbBeLSR/";
      const options = {
        gasLimit: ethers.utils.parseUnits((500000 * mintAmount).toString(), 0),
      }
      console.log("options", options)
      const NFTContractMint = await NFTContract.mint(mintAmount, tokenbaseURI, options);
      const NFTContractTx = await NFTContractMint.wait();
      console.log("await NFTContractTx.wait()", NFTContractTx)
      if(NFTContractTx.status == 1) {
        getMintId();
        getInitialNFTData()
      }
      setMintAmount("")
    }

    const purchaseLicense = async () => {
      setPurchaseAmount("")
      const prices = getETCAmont()
      console.log("prices", prices)
      const tokenAmountInEther = ethers.utils.parseEther(prices.lisenceETCAll.toString());
      const options = {
        value: tokenAmountInEther,
        gasPrice,
        gasLimit: ethers.utils.parseUnits((300000 * purchaseAmount).toString(), 0),
      }
      const approveValue = await tokenContract.approve(NFT_ADDRESS, ethers.utils.parseEther(prices.lisenceToken.toString()))
      const approveValueTx = await approveValue.wait();

      if(approveValueTx.status == 1){
          const purchaseValue = await NFTContract.purchaseLicense(purchaseAmount, options)
          const purchaseValueTx = await purchaseValue.wait()
          if(purchaseValueTx.status == 1){
            getBuyId()
            getInitialNFTData()
            console.log("result", purchaseValueTx)
          }
      }
    }

    return (
      (currentAccount === "") ? (
        ""
      ) : (
        <div className="col-lg-5">
          <div className="saleCard">
            <p className='saleDesc'>NFT Address: <span className="saleDescVal">{accBalanceAmount}</span></p>
            <div className='row sale-row'>
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">Mint Amount</span>
                </div>
                <input type="number" value={mintAmount} onChange={(e) => {setMintAmount(e.target.value)}} step="1" min={1} max={10} className="form-control" placeholder="Enter amount to mint" />
              </div>
              <button onClick={mint} className="cta-button connect-wallet-button">
                NFT MINT
              </button>
            </div>
            <div className='row sale-row'>
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">Lisence Amount</span>
                </div>
                <input type="number" step="1" min={1} max={10} value={purchaseAmount} onChange={(e) => {setPurchaseAmount(e.target.value)}} className="form-control" placeholder="Enter amount to purchase" />
              </div>
              <button onClick={purchaseLicense} className="cta-button connect-wallet-button">
                  PurchaseLicense
              </button>
            </div>
          </div>
        </div>
      )
    );
  }

  const NFTView = () => {
    console.log(initialNFT)
    return(
    <div id="carouselExampleDark" className="carousel slide nftcarousel" data-ride="carousel">
      <div class="carousel-indicators">
        {
          initialNFT && initialNFT.map((v, i) => {
            return <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to={i} class="active" aria-current="true" aria-label={`Slide ${i + 1}`}></button>
          })
        }
      </div>
      <div className="carousel-inner">
        {
           initialNFT && initialNFT.map((v, i) => {
               return (
                <div className={`carousel-item${i == 0 ? " active": ""}`} ><img src={v} className="w-25" width={200} height={200} alt={i}/></div>
               )
               
             }
           )
        }
      </div>
      <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>
      // <div className="col-lg-5 nftcard">
      //   {
      //     initialNFT && initialNFT.map((v, i) => {
      //         return <img src={v} width={200} height={200}/>
      //       }
      //     )
      //   }
      // </div>
    )
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
        <div className="col-lg-5">
          <p className="sub-text">
            Buy TestToken Now, To Get Rich In The Future.
          </p>

          <p className="sub-sub-text">
          TestToken is more than just a Defi Token. It's the best DeFi Token and you can learn here about this crypto
          </p>

        </div>

        {SaleCard()}
        {NFTView()}
        {SaleNFT()}

      </div>
      {Footer()}
    </div>
  );
};

export default App;