import React, { Component } from "react";

// Mainnet
import IndexSwap from "./abis/IndexSwap.json";
import NFTSwap from "./abis/NFTPortfolio.json";

import IERC from "./abis/IERC20.json";
import pancakeSwapRouter from "./abis/IPancakeRouter02.json";
import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';
import { Grid, Button, Card, Form, Input, Image, Message, Table } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import velvet from "./velvet.png";
import metamask from "./metamask-fox.svg";
import swal from 'sweetalert';
import ReactGA from 'react-ga';

import "./App.css";

const axios = require('axios');

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      
      account: '',
      SwapContract: null,
      NFTTokenContract: null,
      DeFiTokenContract: null,
      NFTPortfolioContract: null,

      SwapContract2: null,
      NFTTokenContract2: null,
      DeFiTokenContract2: null,
      NFTPortfolioContract2: null,

      address: "",
      connected: false,
      
      chainId: "",

      defiToMintMainnet: 0,
      nftToMintMainnet: 0,

      withdrawValueDefi: 0,
      withdrawValueNFT: 0,

      nftTokenBalance: 0,
      defiTokenBalance: 0,

      rate: 0
    }
  }

  async componentDidMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
    //await this.getRate();
    //swal("The project is in the alpha stage, proceed at your own risk");

    const web3 = window.web3;
    const chainIdDec = await web3.eth.getChainId();

    this.setState({chainId: chainIdDec})

    if(chainIdDec == "97") {
      await this.calcTokenBalances();
    }  
  }

  // first up is to detect ethereum provider
  async loadWeb3() {
    const provider = await detectEthereumProvider();

    // modern browsers
    if (provider) {
      console.log('MetaMask is connected');

      window.web3 = new Web3(provider);
    } else {
      console.log('No ethereum wallet detected');
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    const chainIdDec = await web3.eth.getChainId();
    const accounts = await window.web3.eth.getAccounts();
    this.setState({account: accounts[0]});
    if(accounts[0]) {
      this.setState({ connected: true })
    }

    this.setState({ account: accounts[0]}) 
    const SwapContract = new web3.eth.Contract(IndexSwap.abi, "0xd4Ac9a82f07e3d35511f890631a31977BE102593");
    const NFTPortfolioContract = new web3.eth.Contract(NFTSwap.abi, "0x244295CbF9F8b5727FA7f61891DC9A06d828d6EE"); 
    this.setState({ SwapContract, NFTPortfolioContract});

  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    })
  }

  connectWallet = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      console.log("Connected");
      this.setState({
        connected: true
      })

    } else {
      alert("Metamask not found");
    }

    this.loadBlockchainData();
    window.location.reload();
  }

  

  investNFTMainnet = async () => {
    const web3 = new Web3(window.ethereum);    
    const v = this.state.nftToMintMainnet;
    const valueInWei = web3.utils.toWei(v.toString(), 'ether');
    
    console.log(this.state.SwapContract);
    const resp = await this.state.NFTPortfolioContract.methods.investInFund(valueInWei).send({ from: this.state.account, value: valueInWei })
    .once("receipt", (receipt) => {
      console.log(receipt);

    })
      .catch((err) => {
        console.log(err);
      });

      if (resp.status) {
        swal("Investment successfull!", `You invested ${v} BNB into the portfolio.`, "success");
        //window.location.reload();
      } else {
        swal("Investment failed!");
      }
  }

  calcTokenBalanceMainnet = async(token, user) => {
    const web3 = new Web3(window.ethereum);
    const vault = "0xD2aDa2CC6f97cfc1045B1cF70b3149139aC5f2a2";

    const indexShare = this.state.IndexSwap.methods.balanceOf(user).call();
    const totalSupplyIndex = this.state.IndexSwap.totalSupply().call();

    const TokenContract = new web3.eth.Contract(IERC.abi, token);
    const tokenSupply = TokenContract.methods.balanceOf(vault).call();

    let tokenShare = indexShare / totalSupplyIndex;
    return tokenShare * tokenSupply;
  }

  approveNFTTokens = async() => {
    const web3 = new Web3(window.ethereum);  
    const contractAddress = "0x244295CbF9F8b5727FA7f61891DC9A06d828d6EE";
    const vault = "0x6056773C28c258425Cf9BC8Ba5f86B8031863164";

    const aXSTokenConntract = new web3.eth.Contract(IERC.abi, "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683");
    await aXSTokenConntract.methods.approve(contractAddress, "115792089237316195423570985008687907853269984665640564039457584007913129639935").send({ from: vault });

    const mANATokenConntract = new web3.eth.Contract(IERC.abi, "0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4");
    await mANATokenConntract.methods.approve(contractAddress, "115792089237316195423570985008687907853269984665640564039457584007913129639935").send({ from: vault });

    const sANDTokenConntract = new web3.eth.Contract(IERC.abi, "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7");
    await sANDTokenConntract.methods.approve(contractAddress, "115792089237316195423570985008687907853269984665640564039457584007913129639935").send({ from: vault });

  }

  approveDeFiTokens = async() => {
    const web3 = new Web3(window.ethereum);  
    const contractAddress = "0xd4Ac9a82f07e3d35511f890631a31977BE102593";
    const vault = "0x6056773C28c258425Cf9BC8Ba5f86B8031863164";

    const BTCTokenConntract = new web3.eth.Contract(IERC.abi, "0x6f7C932e7684666C9fd1d44527765433e01fF61d");
    BTCTokenConntract.methods.approve(contractAddress, "115792089237316195423570985008687907853269984665640564039457584007913129639935").send({ from: vault });

    const ETHTokenConntract = new web3.eth.Contract(IERC.abi, "0xb33EaAd8d922B1083446DC23f610c2567fB5180f");
    ETHTokenConntract.methods.approve(contractAddress, "115792089237316195423570985008687907853269984665640564039457584007913129639935").send({ from: vault });

    const SHIBATokenConntract = new web3.eth.Contract(IERC.abi, "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39");
    SHIBATokenConntract.methods.approve(contractAddress, "115792089237316195423570985008687907853269984665640564039457584007913129639935").send({ from: vault });

    const XRPTokenConntract = new web3.eth.Contract(IERC.abi, "0xD6DF932A45C0f255f85145f286eA0b292B21C90B");
    XRPTokenConntract.methods.approve(contractAddress, "115792089237316195423570985008687907853269984665640564039457584007913129639935").send({ from: vault });

    const LTCTokenConntract = new web3.eth.Contract(IERC.abi, "0x8505b9d2254A7Ae468c0E9dd10Ccea3A837aef5c");
    LTCTokenConntract.methods.approve(contractAddress, "115792089237316195423570985008687907853269984665640564039457584007913129639935").send({ from: vault });

  }

  withdrawDeFiMainnet = async () => {

    const web3 = new Web3(window.ethereum);

    var withdrawAmt = this.state.withdrawValueDefi;
    var withdrawAmountInWei = web3.utils.toWei(withdrawAmt, 'ether');
    var sAmount = withdrawAmountInWei.toString();
    const contractAddress = "0xd4Ac9a82f07e3d35511f890631a31977BE102593";

    await this.state.SwapContract.methods.approve(contractAddress, "115792089237316195423570985008687907853269984665640564039457584007913129639935")
    .send({from: this.state.account});

    await this.state.SwapContract.methods.withdrawFromFundNew(sAmount
    ).send({
      from: this.state.account, value: 0
    }).once("receipt", (receipt) => {
      swal("Withdrawal successfull!", "The withdrawal was successful!", "success");
      console.log(receipt);
    })
      .catch((err) => {
        console.log(err);
      });

  }

  withdrawNFTMainnet = async () => {

    const web3 = new Web3(window.ethereum);

    var withdrawAmt = this.state.withdrawValueNFT;
    var withdrawAmountInWei = web3.utils.toWei(withdrawAmt, 'ether');
    var sAmount = withdrawAmountInWei.toString();
    const contractAddress = "0x244295CbF9F8b5727FA7f61891DC9A06d828d6EE";

    await this.state.NFTPortfolioContract.methods.approve(contractAddress, "115792089237316195423570985008687907853269984665640564039457584007913129639935")
    .send({from: this.state.account});

    await this.state.SwapContract.methods.withdrawFromFundNew(sAmount
    ).send({
      from: this.state.account, value: 0
    }).once("receipt", (receipt) => {
      swal("Withdrawal successfull!", "The withdrawal was successful!", "success");
      console.log(receipt);
    })
      .catch((err) => {
        console.log(err);
      });
  }


  // TESTNET

  investNFT = async () => {

    const web3 = new Web3(window.ethereum);    
    const v = this.state.defiToMint;
    const valueInWei = web3.utils.toWei(v, 'ether');
    
    const resp = await this.state.NFTPortfolioContract2.methods.investInFund(valueInWei).send({ from: this.state.account, value: valueInWei })
    .once("receipt", (receipt) => {
      console.log(receipt);

    })
      .catch((err) => {
        console.log(err);
      });

      if (resp.status) {
        swal("Investment successfull!", `You invested ${v} BNB into the portfolio.`, "success");
        //window.location.reload();
      } else {
        swal("Investment failed!");
      }

      await this.calcTokenBalances();

  }

  calcTokenBalances = async () => {
    const web3 = new Web3(window.ethereum);
    let defiTokenBalanceInWei = await this.state.SwapContract2.methods.balanceOf(this.state.account).call();
    let defiTokenBalance = web3.utils.fromWei(defiTokenBalanceInWei, "ether");

    let nftTokenBalanceInWei = await this.state.SwapContract2.methods.balanceOf(this.state.account).call();
    let nftTokenBalance = web3.utils.fromWei(nftTokenBalanceInWei, "ether");

    this.setState({ defiTokenBalance, nftTokenBalance });
    
  }

  investDeFiMainnet = async () => {
    const web3 = new Web3(window.ethereum);    
    const v = this.state.defiToMintMainnet;
    const valueInWei = web3.utils.toWei(v, 'ether');
    
    console.log(this.state.SwapContract);
    const resp = await this.state.SwapContract.methods.investInFund(valueInWei).send({ from: this.state.account, value: valueInWei })
    .once("receipt", (receipt) => {
      console.log(receipt);

    })
      .catch((err) => {
        console.log(err);
      });

      if (resp.status) {
        swal("Investment successfull!", `You invested ${v} BNB into the portfolio.`, "success");
        //window.location.reload();
      } else {
        swal("Investment failed!");
      }

  }

  withdrawDeFi = async () => {
    const web3 = new Web3(window.ethereum);

    var withdrawAmt = this.state.withdrawValueDefi;
    var withdrawAmountInWei = web3.utils.toWei(withdrawAmt, 'ether');
    var sAmount = withdrawAmountInWei.toString();

    await this.state.SwapContract2.methods.approve("0xd4Ac9a82f07e3d35511f890631a31977BE102593", "115792089237316195423570985008687907853269984665640564039457584007913129639935")
    .send({from: this.state.account});

    await this.state.SwapContract2.methods.withdrawFromFundNew(sAmount
    ).send({
      from: this.state.account, value: 0
    }).once("receipt", (receipt) => {
      swal("Withdrawal successfull!", "The withdrawal was successful!", "success");
      console.log(receipt);
    })
      .catch((err) => {
        console.log(err);
      });

      await this.calcTokenBalances();

  }
  withdrawNFT = async () => {
    const web3 = new Web3(window.ethereum);

    var withdrawAmt = this.state.withdrawValueNFT;
    var withdrawAmountInWei = web3.utils.toWei(withdrawAmt.toString(), 'ether');
    var sAmount = withdrawAmountInWei.toString();

    console.log(this.state.NFTPortfolioContract2);

    await this.state.NFTPortfolioContract2.methods.approve("0x244295CbF9F8b5727FA7f61891DC9A06d828d6EE", "115792089237316195423570985008687907853269984665640564039457584007913129639935")
    .send({from: this.state.account});

    await this.state.NFTPortfolioContract2.methods.withdrawFromFundNew(sAmount
    ).send({
      from: this.state.account, value: 0
    }).once("receipt", (receipt) => {
      swal("Withdrawal successfull!", "The withdrawal was successful!", "success");
      console.log(receipt);
    })
      .catch((err) => {
        console.log(err);
      });

  }

  getExchangeRate = async (amountIn, address) => {
    const web3 = window.web3;
    const pancakeRouter = new web3.eth.Contract(pancakeSwapRouter.abi, "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3");

    var path = [];
    path[0] = address;
    path[1] = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

    const er = await pancakeRouter.methods.getAmountsOut(amountIn, path).call();
    return er[1];
  }

  init = async() => {
    await this.state.SwapContract2.methods.initializeDefult().send({from: this.state.account});
    await this.state.SwapContract2.methods.updateRate(1,1).send({from: this.state.account});
  }

  initMainnet = async() => {
    await this.state.SwapContract.methods.initializeDefult().send({from: this.state.account});
    await this.state.SwapContract.methods.updateRate(1,1).send({from: this.state.account});
  }

  initnft = async() => {
    await this.state.NFTPortfolioContract2.methods.initializeDefult().send({from: this.state.account});
    await this.state.NFTPortfolioContract2.methods.updateRate(1,1).send({from: this.state.account});
  }

  render() {

    window.addEventListener("load", function() {
      if (window.ethereum) {
        // use MetaMask's provider
        App.web3 = new Web3(window.ethereum);
        window.ethereum.enable(); // get permission to access accounts
    
        // detect Metamask account change
        window.ethereum.on('accountsChanged', function (accounts) {
          console.log('accountsChanges',accounts);
    
        });
    
         // detect Network account change
        window.ethereum.on('networkChanged', function(networkId){
          console.log('networkChanged',networkId);
        });

      } else {
        console.warn(
          "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",
        );
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        App.web3 = new Web3(
          new Web3.providers.HttpProvider("http://127.0.0.1:7545"),
        );
      }
    });

    const web3 = window.web3;

    let button;
    if (!this.state.connected) {
      button = <Button style={{ position: "absolute", top: "60px", right: "20px" }} onClick={this.connectWallet} color="orange">
          <Image style={{ "padding-top": "7px" }} floated="left" size="mini" src={metamask} />
          <p>Connect to MetaMask</p>
        </Button>
    } else {
      button = <p style={{ position: "absolute", top: "110px", right: "20px", color: "#C0C0C0" }}><b>Account:</b> {this.state.account}</p>
    }

      
      let mainnet;
      mainnet = 
      <div>
      <Grid divided='vertically'>
        <Grid.Row columns={2} style={{ margin: "20px" }}>
          <Grid.Column>

            <Card.Group>
              <Card style={{ width: "900px" }}>
                <Card.Content style={{ background: "#406ccd" }}>
                  <Card.Header style={{ color: "white" }}>
                  <p style={{ color: "#C0C0C0", "font-weight": "bold", "text-align": "right" }}>APY: XX%</p>
                    Top 5 Blue Chip DeFi Tokens
                    </Card.Header>
                  <Card.Description>

                    <Form onSubmit={this.investDeFiMainnet}>
                      <Input style={{ width: "300px", padding: 3 }} required type="text" placeholder="BNB amount to create" name="defiToMintMainnet" onChange={this.handleInputChange}></Input>
                      <Button color="green" type="submit" style={{ margin: "20px", width: "150px" }}>Create</Button>
                    </Form>

                    <Form onSubmit={this.withdrawDeFiMainnet}>
                      <Input style={{ width: "300px", padding: 3 }} required type="text" placeholder="IDX amount to redeem" name="withdrawValueDefi" onChange={this.handleInputChange}></Input>
                      <Button color="green" style={{ margin: "20px", width: "150px" }}>Redeem</Button>
                    </Form>

                  </Card.Description>
                </Card.Content>
              </Card>
            </Card.Group>
          </Grid.Column>

          <Grid.Column>

            <Card.Group>
              <Card style={{ width: "900px" }}>
                <Card.Content style={{ background: "#406ccd" }}>
                  <Card.Header style={{ color: "white" }}>
                  <p style={{ color: "#C0C0C0", "font-weight": "bold", "text-align": "right" }}>APY: XX%</p>
                    Top 3 NFT / Metaverse Tokens
                    </Card.Header>
                  <Card.Description>

                    <Form onSubmit={this.investNFTMainnet}>
                      <Input style={{ width: "300px", padding: 3 }} required type="text" placeholder="BNB amount to create" name="nftToMintMainnet" onChange={this.handleInputChange}></Input>
                      <Button color="green" type="submit" style={{ margin: "20px", width: "150px" }}>Create</Button>
                    </Form>

                    <Form onSubmit={this.withdrawNFTMainnet}>
                      <Input style={{ width: "300px", padding: 3 }} required type="text" placeholder="IDX amount to redeem" name="withdrawValueNFT" onChange={this.handleInputChange}></Input>
                      <Button color="green" style={{ margin: "20px", width: "150px" }}>Redeem</Button>
                    </Form>

                  </Card.Description>
                </Card.Content>
              </Card>
            </Card.Group>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      </div>

    return (
      <div className="App">
        <div>
        <Message negative>
          <Message.Header>The project is in the alpha stage, proceed at your own risk.</Message.Header>
        </Message>
      </div>
        <br></br>

        <Image src={velvet} size="medium" verticalAlign='middle'></Image>

        {button}
        
        {mainnet}

      </div >
    );
  }
}

export default App;
