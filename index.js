import { refreshProvider } from './web3js/refreshProvider.js';
import factoryAbi from './abi/uniswap-v2-factory-abi.js';
import erc20abi from './abi/erc20-abi.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// WEB3
import Web3 from 'web3';
const web3 = new Web3();
var provider = refreshProvider(web3, process.env.INFURA_WSS);

provider.on('error', () => {
    console.log('Web3js', 'Web3 Websocket Provider lost connection, trying to reconnect');
    provider = refreshProvider(web3, process.env.INFURA_WSS);
});

provider.on('end', () => {
    console.log('Web3js', 'Web3 Websocket Provider lost connection, trying to reconnect');
    provider = refreshProvider(web3, process.env.INFURA_WSS);
});

// UniswapV2Factory Contract
const factoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

async function getHoneypotData(tokenAddress) {
    try {
    const resp = await fetch(`https://api.honeypot.is/v1/GetPairs?address=${tokenAddress}&chainID=1`)
    const data = await resp.json()
    const resp2 = await fetch(`https://api.honeypot.is/v1/IsHoneypot?address=${tokenAddress}&router=${data[0].Router}&pair=${data[0].Pair.Address}&chainID=1`)
    const data2 = await resp2.json()
    return data2.IsHoneypot
    } catch (e) {
    console.error(e)
    }
}

// This function takes in an address for an erc20 token and pulls the block number of the creation transaction
async function getCreationBlock(tokenAddress) {
    const tokenContract = new web3.eth.Contract(erc20abi, tokenAddress);
    const creationBlock = await tokenContract.methods.creationBlock().call();
    return creationBlock;
}

// This function takes in an address for an erc20 token and console logs all of the functions in the contract
async function getFunctions(tokenAddress) {
    const tokenContract = new web3.eth.Contract(erc20abi, tokenAddress);
    const functions = await tokenContract.methods.getFunctions().call();
    console.log(functions);
}

var uniswapV2FactoryContract = new web3.eth.Contract(factoryAbi, factoryAddress);

// Check for PairCreated Events
uniswapV2FactoryContract.events
    .PairCreated({})
    .on('data', async function (event) {
        const token0 = await new web3.eth.Contract(erc20abi, event.returnValues.token0);
        const token1 = await new web3.eth.Contract(erc20abi, event.returnValues.token1);
        const token0Symbol = await token0.methods.symbol().call();
        const token1Symbol = await token1.methods.symbol().call();
        // Check if it's a WETH Pair
        if (token0Symbol === 'WETH' || token1Symbol === 'WETH') {
            if (token0Symbol !== 'WETH') {
                console.log('Contract', `Detected new WETH pair on Uniswap V2: ${token0Symbol} ${event.returnValues.token0} - ${token1Symbol} ${event.returnValues.token1}!`);
                const honeyPot = await getHoneypotData(event.returnValues.token0);
                if (await honeyPot == null) {
                    console.log(`Not sure if ${token0Symbol} is a Honeypot. Please check manually`)
                } else if (await honeyPot) {
                    console.log('Contract', `${token0Symbol} is a Honeypot!`)
                } else if (!honeyPot) {
                    console.log('Contract', `${token0Symbol} is not a Honeypot!`)
                }
            } else {
                console.log('Contract', `Detected new WETH pair on Uniswap V2: ${token1Symbol} ${event.returnValues.token1} - ${token0Symbol} ${event.returnValues.token0}!`);
                const honeyPot = await getHoneypotData(event.returnValues.token1);
                if (await honeyPot == null) {
                    console.log(`Not sure if ${token1Symbol} is a Honeypot. Please check manually`)
                } else if (await honeyPot) {
                    console.log('Contract', `${token1Symbol} is a Honeypot!`)
                } else if (!honeyPot) {
                    console.log('Contract', `${token1Symbol} is not a Honeypot!`)
                }
            }
        } else {
            console.log('Contract', `New Pair Detected ${token0Symbol} - ${token1Symbol}, but I'm skipping because its not a WETH pair`);
        }
    })
    .on('error', async function (error) {
        console.log('Contract', error.message, error);
    });
