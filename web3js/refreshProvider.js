import Web3 from 'web3';

/**
 * Refreshes provider instance and attaches even handlers to it
 */
const NAMESPACE = 'Web3js';

export function refreshProvider(web3Obj, providerUrl) {
    const provider = new Web3.providers.WebsocketProvider(providerUrl);

    web3Obj.setProvider(provider);

    console.log(NAMESPACE, `Web3 Websocket Provider initiated on ${providerUrl}`);

    return provider;
}