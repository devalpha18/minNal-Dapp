import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Drawer from "@mui/joy/Drawer";
import Divider from "@mui/joy/Divider";
import Modal from "@mui/joy/Modal";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CircularProgress from "@mui/material/CircularProgress";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import Token_Abi from "./assets/Token.json";
import ICO_Abi from "./assets/ICO.json";
import NFT_Abi from "./assets/NDL.json";

// Constants
const ICO_ADDRESS = "0x887D518c63E164B83FE1793f50fd3e3520C7E9eb";
const TOKEN_ADDRESS = "0x7c73F54BDf20F13b037FF1A812D0B30429BEe705";
const NFT_ADDRESS = "0x9330A3873DBebBfBcB862E06c6eE9F4fC05D0A47";

const Footer = () => {
  return (
    <div className="footer-container">
      <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
    </div>
  );
};

const App = () => {
  const [accBalanceAmount, setAccBalanceAmount] = useState();
  const [tokenBalanceAmount, setTokenBalanceAmount] = useState();
  const [ethereumObj, setEthereum] = useState();
  const [tokenContract, setTokenContract] = useState();
  const [icoContract, setICOContract] = useState();
  const [NFTContract, setNFTContract] = useState();
  const [gasPrice, setGasprice] = useState();
  const [ETCPrice, setETCPrice] = useState();
  const [initialNFT, setInitialNFT] = useState();
  const [currentAccount, setCurrentAccount] = useState("");
  const [lpState, setLpState] = useState({
    etc: false,
    navi: false,
    state: false,
  });
  const [purchaseType, setPurchaseType] = useState(true);
  const [open, setOpen] = useState(false);
  const [payAmount, setPayAmount] = useState({ etc: 0, navi: 0 });
  const [mintAmount, setMintAmount] = useState("");
  const [nftPrice, setNftPrice] = useState({ Price: 0, ETC: 0, Navi: 0 });
  const [usdValue, setUsdValue] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const coingeckoApiUrl =
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum-classic&vs_currencies=usd";
    fetch(
      fetch(coingeckoApiUrl)
        .then((response) => response.json())
        .then((data) => {
          const etcPrice = data["ethereum-classic"].usd;
          console.log(`Current ETC Price: $${etcPrice}`);
          setETCPrice(etcPrice);
        })
        .catch((error) => {
          console.error("Error fetching ETC price:", error);
        })
    );
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    provider.getGasPrice().then((res) => {
      setGasprice(res);
    });
    const Token = new ethers.Contract(TOKEN_ADDRESS, Token_Abi.abi, signer);
    const ICO = new ethers.Contract(ICO_ADDRESS, ICO_Abi.abi, signer);
    const NFT = new ethers.Contract(NFT_ADDRESS, NFT_Abi.abi, signer);
    setTokenContract(Token);
    setICOContract(ICO);
    setNFTContract(NFT);
    checkIfWalletIsConnected();
    getBalance();
  }, []);

  useEffect(() => {
    getInitialNFTData();
  }, [NFTContract]);

  const getInitialNFTData = async () => {
    const balanceNFT =
      NFTContract && (await NFTContract.balanceOf(NFT_ADDRESS));
    let tokenUris = [];
    for (let i = 0; i < balanceNFT; i++) {
      tokenUris[i] = await NFTContract.tokenURI(i);
    }
    NFTContract &&
      NFTContract.getPrice().then((res) => {
        setNftPrice({
          Price: res[0].toString() / 10 ** 18,
          ETC: res[1].toString() / 10 ** 18,
          Navi: res[2].toString() / 10 ** 18,
        });
        setLoading(true);
      });

    setInitialNFT(tokenUris);
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    const setEthereumObj = () => {
      return new Promise((resolve, reject) => {
        if (ethereum) {
          setEthereum(ethereum);
          resolve(ethereum);
        } else {
          reject(false);
        }
      });
    };

    const flag = await setEthereumObj();

    if (!flag) {
      console.log("Make sure you have metamask");
      return;
    } else {
      console.log("We have a ethereum object");
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length != 0) {
      const account = accounts[0];
      setCurrentAccount(account);
    } else {
      console.log("Could not find authorized account");
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereumObj) {
        console.log("Get Metamask");
        return;
      }
      const accounts = await ethereumObj.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
      getBalance();
    } catch (error) {
      console.log(error);
    }
  };

  const buyToken = async (amount) => {
    try {
      if (ethereumObj) {
        const tokenAmountInEther = ethers.utils.parseEther(
          (0.015 * Number(amount)).toString()
        );
        const options = {
          gasPrice,
          gasLimit: ethers.utils.parseUnits("200000", 0),
          value: tokenAmountInEther,
        };
        const tx = await icoContract.buy(options);
        const result = await tx.wait();
        if (result.confirmations) getBalance();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const withdrawToken = async (amount) => {
    try {
      if (ethereumObj) {
        const tx = await icoContract.withdraw(ethers.utils.parseEther(amount));
        const result = await tx.wait();
        if (result.confirmations) getBalance();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const withdrawERC20 = async (amount) => {
    try {
      if (ethereumObj) {
        const tx = await icoContract.withdrawERC20(
          ethers.utils.parseEther(amount)
        );
        const result = await tx.wait();
        if (result.confirmations) getBalance();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getBalance = async () => {
    if (ethereumObj) {
      const tokenDecimal = await tokenContract.decimals();
      const ICO_balance =
        (await tokenContract.balanceOf(ICO_ADDRESS)) /
        Math.pow(10, tokenDecimal);
      const Account_balance =
        (await tokenContract.balanceOf(ethereumObj.selectedAddress)) /
        Math.pow(10, tokenDecimal);
      setTokenBalanceAmount(ICO_balance);
      setAccBalanceAmount(Account_balance);
    }
  };

  const Wallet = () => {
    return currentAccount === "" ? (
      <button
        onClick={connectWallet}
        className="cta-button connect-wallet-button"
      >
        Connect Wallet
      </button>
    ) : (
      <div>
        <p className="wallet-address">
          <span className="bold">Connected:</span> {currentAccount}
        </p>
      </div>
    );
  };

  const Buy = (props) => {
    const [tokenAmount, setTokenAmount] = useState("");

    const handleAmountInput = (e) => {
      setTokenAmount(e.target.value);
    };

    const handleBuy = async () => {
      if (tokenAmount >= props.min && tokenAmount <= props.max) {
        await buyToken(tokenAmount);
        setTokenAmount("");
      }
    };

    return (
      <div>
        <div className="row sale-row">
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">TEST Token</span>
            </div>

            <input
              type="number"
              min={props.min}
              max={props.max}
              step="100"
              onChange={handleAmountInput}
              value={tokenAmount}
              className="form-control"
              placeholder="Enter Amount"
            />
          </div>
        </div>

        <div className="row sale-row">
          <button
            onClick={handleBuy}
            className="cta-button connect-wallet-button"
          >
            Buy TEST_TOKEN
          </button>
        </div>
      </div>
    );
  };

  const Withdraw = () => {
    const [withdrawAmount, setWithdrawAmount] = useState("");

    const handleAmountInput = (e) => {
      setWithdrawAmount(e.target.value);
    };

    const handleWithdraw = async () => {
      withdrawToken(withdrawAmount);
      setWithdrawAmount("");
    };

    const handleWithdrawERC20 = async () => {
      withdrawERC20(withdrawAmount);
      setWithdrawAmount("");
    };

    return (
      <div>
        <div className="row sale-row">
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text">Withdraw Amount</span>
            </div>
            <input
              type="number"
              step="any"
              onChange={handleAmountInput}
              value={withdrawAmount}
              className="form-control"
              placeholder="Enter Amount"
            />
          </div>
        </div>
        <div className="row sale-row">
          <button
            onClick={handleWithdraw}
            className="cta-button connect-wallet-button"
          >
            Withdraw ETC
          </button>
          <button
            onClick={handleWithdrawERC20}
            className="cta-button connect-wallet-button"
          >
            Withdraw MinnalX01
          </button>
        </div>
      </div>
    );
  };

  const SaleCard = () => {
    return currentAccount === "" ? (
      ""
    ) : (
      <div className="col-lg-5">
        <div className="saleCard">
          <div className="row sale-row">
            <p className="saleDesc">
              Account Balance:{" "}
              <span className="saleDescVal">{accBalanceAmount}</span>
            </p>
            <p className="saleDesc">
              Token Name: <span className="saleDescVal">TEST TOKEN</span>
            </p>
            <p className="saleDesc">
              Available Token Balanace:{" "}
              <span className="saleDescVal">{tokenBalanceAmount}</span>
            </p>
            <p className="saleDesc">
              Price: <span className="saleDescVal">1 TEST = 0.015 METC</span>
            </p>
          </div>
          <Buy min={100} max={500} />
          <Withdraw />
        </div>
      </div>
    );
  };

  const SaleNFT = () => {
    const mint = async () => {
      const tokenbaseURI =
        "https://white-progressive-moose-640.mypinata.cloud/ipfs/QmamgBXfdt7hRGomvV33Tg3z6TNgmcf6TsRnvamEyWQJmJ/";

      const options = {
        gasLimit: ethers.utils.parseUnits((200000 * mintAmount).toString(), 0),
      };

      const NFTContractMint = await NFTContract.mint(
        mintAmount,
        tokenbaseURI,
        options
      );

      const NFTContractTx = await NFTContractMint.wait();
      if (NFTContractTx.status == 1) {
        getInitialNFTData();
      }
      setMintAmount(null);
    };

    const calcPrice = async (price) => {
      const adminAmountETC = ((price * 0.7) / ETCPrice).toFixed(2);
      const adminAmountNavi = (((price * 0.3) / ETCPrice) * 5).toFixed(2);
      setNftPrice({ Price: price, ETC: adminAmountETC, Navi: adminAmountNavi });
    };

    const handelSetPrice = async () => {
      const fixedPrice = await NFTContract.setPrice(
        ethers.utils.parseEther(nftPrice.Price.toString()),
        ethers.utils.parseEther(nftPrice.ETC.toString()),
        ethers.utils.parseEther(nftPrice.Navi.toString())
      );
      await fixedPrice.wait();
    };

    return currentAccount === "" ? (
      ""
    ) : (
      <div className="col-lg-5">
        <div className="saleCard">
          <div className="row sale-row">
            <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text">NFT Price</span>
              </div>
              <input
                type="number"
                className="form-control"
                placeholder="Enter NFT Price(USD)"
                value={usdValue || ""}
                onChange={(e) => {
                  setUsdValue(e.target.value), calcPrice(e.target.value);
                  setUsdValue("");
                }}
              />
            </div>
            <div className="salePriceState">
              <div className="input-group-prepend-state">
                <p className="input-group-text-state">
                  <span>ETC Price</span>
                  <span>{nftPrice.ETC}</span>
                </p>
                <p className="input-group-text-state">
                  <span>Navi Price</span>
                  <span>{nftPrice.Navi}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handelSetPrice}
              className="cta-button connect-wallet-button"
            >
              Set Price
            </button>
          </div>
          <div className="row sale-row">
            <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text">Mint Amount</span>
              </div>
              <input
                type="number"
                onChange={(e) => {
                  setMintAmount(e.target.value);
                }}
                step="1"
                min={1}
                max={30}
                className="form-control"
                placeholder="Enter amount to mint"
              />
            </div>
            <button onClick={mint} className="cta-button connect-wallet-button">
              NFT MINT
            </button>
          </div>
          <div className="row sale-row">
            <button
              onClick={() => buyLicense(true)}
              className="cta-button connect-wallet-button"
            >
              PurchaseLicense Package 1
            </button>
            <button
              onClick={() => buyLicense(false)}
              className="cta-button connect-wallet-button"
            >
              PurchaseLicense Package 2
            </button>
          </div>
        </div>
      </div>
    );
  };

  const NFTView = () => {
    return (
      initialNFT &&
      initialNFT.length > 0 && (
        <div
          id="carouselExampleDark"
          className="carousel slide nftcarousel"
          data-ride="carousel"
        >
          <div className="carousel-indicators">
            {initialNFT &&
              initialNFT.map((v, i) => {
                return (
                  <button
                    key={i}
                    type="button"
                    data-bs-target="#carouselExampleDark"
                    data-bs-slide-to={i}
                    className="active"
                    aria-current="true"
                    aria-label={`Slide ${i + 1}`}
                  ></button>
                );
              })}
          </div>
          <div className="carousel-inner">
            {initialNFT &&
              initialNFT.map((v, i) => {
                return (
                  <div
                    key={i}
                    className={`carousel-item${i == 0 ? " active" : ""}`}
                  >
                    <img
                      src={v}
                      className="w-25"
                      width={200}
                      height={200}
                      alt={i}
                    />
                  </div>
                );
              })}
          </div>
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#carouselExampleDark"
            data-bs-slide="prev"
          >
            <span
              className="carousel-control-prev-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#carouselExampleDark"
            data-bs-slide="next"
          >
            <span
              className="carousel-control-next-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
      )
    );
  };

  const validateETC = async (option) => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const balanceETC = await provider.getBalance(
      window.ethereum.selectedAddress
    );
    const balanceNavi = await tokenContract.balanceOf(
      window.ethereum.selectedAddress
    );

    const balanceInEth = ethers.utils.formatUnits(balanceETC, 18).toString();
    const balanceNaviInt = ethers.utils.formatEther(balanceNavi, 18).toString();
    const product_ETC = option
      ? Number(nftPrice.ETC.toString())
      : Number((nftPrice.ETC * 9).toString());
    const product_Navi = option
      ? Number(nftPrice.Navi.toString())
      : Number((nftPrice.Navi * 9).toString());

    await setLpState((old) => {
      return {
        ...old,
        etc: product_ETC < Number(balanceInEth) ? true : false,
        navi: product_Navi < Number(balanceNaviInt) ? true : false,
        state: true,
      };
    });

    setPayAmount((old) => {
      return {
        ...old,
        etc: option ? 105 : 945,
        navi: option ? 45 : 405,
      };
    });
    if (
      product_ETC < Number(balanceInEth) &&
      product_Navi < Number(balanceNaviInt)
    )
      return true;
    else return false;
  };

  const getETCAmont = (type) => {
    const AllPrice = type ? nftPrice.Price : nftPrice.Price * 9;
    const lisenceETC = type ? nftPrice.ETC : nftPrice.ETC * 9;
    const lisenceToken = type ? nftPrice.Navi : nftPrice.Navi * 9;
    const data = {
      AllPrice: AllPrice,
      lisenceETC: lisenceETC,
      lisenceToken: lisenceToken,
    };
    return data;
  };

  const purchaseLicense = async (type) => {
    const prices = getETCAmont(type);
    const amount = type ? 1 : 10;
    const tokenAmountInEther = ethers.utils.parseEther(
      prices.lisenceETC.toString()
    );
    const tokenAmountInNavi = ethers.utils.parseUnits(
      prices.lisenceToken.toString(),
      18
    );
    const options = {
      value: tokenAmountInEther,
      gasPrice,
      gasLimit: ethers.utils.parseUnits((500000 * amount).toString(), 0),
    };
    const approveValue = await tokenContract.approve(
      NFT_ADDRESS,
      tokenAmountInNavi
    );
    try {
      const urltx = "https://api.minnal.dk/pandora/savetransaction";
      const urlNode = "https://api.minnal.dk/pandora/savenode";

      const approveValueTx = await approveValue.wait();
      if (approveValueTx.status == 1) {
        setLpState((old) => {
          return {
            ...old,
            state: false,
          };
        });
        const purchaseValue = await NFTContract.purchaseLicense(
          amount.toString(),
          options
        );
        const purchaseValueTx = await purchaseValue.wait();

        const postDataETC = {
          apiKey: "5bFtYb3yDWnWJYYfEvQZgxEDpe2MMKzLk7kPeQ==",
          licenseAmount: amount,
          walletAddress: window.ethereum.selectedAddress,
          transactionHash: purchaseValueTx.transactionHash,
          priceUSD: prices.AllPrice.toString(),
          priceETC: prices.lisenceETC.toString(),
          priceNavi: prices.lisenceToken.toString(),
        };
        const postDataNode = {
          apiKey: "5bFtYb3yDWnWJYYfEvQZgxEDpe2MMKzLk7kPeQ==",
          walletAddress: window.ethereum.selectedAddress,
          licenseAmount: amount,
          transactionHash: purchaseValueTx.transactionHash,
        };

        if (purchaseValueTx.status == 1) {
          const rsSaveNodeETC = await saveTransaction(urltx, postDataETC);
          if (rsSaveNodeETC) {
            const rsSaveTransaction = await saveTransaction(
              urlNode,
              postDataNode
            );
            rsSaveTransaction && setOpen(true);
          }
          getInitialNFTData();
        }
      }
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  const saveTransaction = async (url, postData) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const data = await response.json();
        return true;
      } else {
        console.error("Failed to save transaction");
        return false;
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  const buyLicense = async (type) => {
    setPurchaseType(type);
    const flag = await validateETC(type);
    if (flag) {
      await purchaseLicense(type);
      return;
    } else {
      return;
    }
  };

  return (
    <div className="App container-fluid">
      <nav className="navbar">
        <div className="header-container">
          <p className="header gradient-text">TestToken</p>
        </div>
        <div className="wallet-container">{Wallet()}</div>
      </nav>

      <div className="row app-row app-container">
        <div className="col-lg-5">
          <p className="sub-text">
            Buy TestToken Now, To Get Rich In The Future.
          </p>

          <p className="sub-sub-text">
            TestToken is more than just a Defi Token. It's the best DeFi Token
            and you can learn here about this crypto
          </p>
        </div>
        {SaleCard()}
        {currentAccount ? <NFTView /> : null}
        {loading ? (
          SaleNFT()
        ) : (
          <div>
            <CircularProgress />
          </div>
        )}

        {
          <>
            <Drawer
              anchor={"top"}
              open={lpState.state}
              onClose={() =>
                setLpState((old) => {
                  return {
                    ...old,
                    state: false,
                  };
                })
              }
            >
              <Box
                role="presentation"
                onKeyDown={() =>
                  setLpState((old) => {
                    return {
                      ...old,
                      state: false,
                    };
                  })
                }
                sx={{
                  p: 3,
                  display: "flex",
                  justifyItems: "center",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "20px",
                  justifyContent: "space-around",
                  height: "100%",
                }}
              >
                <div className="drawer_popup_title">Payment</div>
                <Divider />
                <div>
                  <p style={{ fontSize: "14px" }}>
                    {`You will have to pay ${payAmount.etc}$USD (in ${
                      getETCAmont(purchaseType).lisenceETC
                    }$ETC) and ${payAmount.navi}$USD (in ${
                      getETCAmont(purchaseType).lisenceToken
                    }$Navi) using
                      your wallet. If you see an error, please contact us right
                      away, and don't try to pay again`}
                  </p>
                </div>
                <div className="drawer_popup_content">
                  <div className="drawer_popup_content_etc">
                    <div className="popup_content_title">
                      <span>ETC Payment</span>
                      <span>
                        {lpState.etc ? <CheckCircleIcon /> : <CancelIcon />}
                      </span>
                    </div>
                    <div className="popup_content_tick">{`$${
                      getETCAmont(purchaseType).lisenceETC
                    }ETC Payment ${payAmount.etc}$ USD`}</div>
                  </div>
                  <Divider
                    orientation={"vertical"}
                    sx={{ background: "#000" }}
                  />
                  <div className="drawer_popup_content_navi">
                    <div className="popup_content_title">
                      <span>Navi Payment</span>
                      <span>
                        {lpState.navi ? <CheckCircleIcon /> : <CancelIcon />}
                      </span>
                    </div>
                    <div className="popup_content_tick">{`$${
                      getETCAmont(purchaseType).lisenceToken
                    }Navi Payment ${payAmount.navi}$ USD`}</div>
                  </div>
                </div>
                <Button
                  variant="outlined"
                  size="lg"
                  color="danger"
                  onClick={() =>
                    setLpState((old) => {
                      return {
                        ...old,
                        state: false,
                      };
                    })
                  }
                >
                  Close
                </Button>
              </Box>
            </Drawer>
            <Modal
              aria-labelledby="modal-title"
              aria-describedby="modal-desc"
              open={open}
              onClose={() => setOpen(false)}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Sheet
                variant="outlined"
                sx={{
                  maxWidth: 500,
                  borderRadius: "md",
                  p: 3,
                  boxShadow: "lg",
                }}
              >
                <Typography
                  component="h2"
                  id="modal-title"
                  level="h4"
                  textColor="inherit"
                  fontWeight="lg"
                  mb={1}
                >
                  All transactions have been saved successfully.
                </Typography>
              </Sheet>
            </Modal>
          </>
        }
      </div>
      {Footer()}
    </div>
  );
};

export default App;
