const Tx = require("ethereumjs-tx").Transaction;
const Web3 = require("web3");
const config = require("config");
const infuraURL = "https://ropsten.infura.io/v3";
const APIkey = "a5779050f7e94b9d89595d7a33a04c58";
const infura = `${infuraURL}/${APIkey}`;
let web3 = new Web3(new Web3.providers.HttpProvider(infura));
const addr = "0x771907D235Dd1E85af69B442709348C2Ca0d13aD";
// const abi = config.get("abi");
const abi =[
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "prescription_id",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "data",
				"type": "string"
			}
		],
		"name": "newPresc",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "prescription",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const pk = "535f82132a681746aebdc49501686f67a2d38b349704037935c62c4b28d458f9";
const contractAddr = "0xC6c63bA6bf388b05fA9234465434190315baC6C6";
const chain = "network";
const contract = new web3.eth.Contract(abi, contractAddr);

async function getTransactionCount() {
  return await web3.eth
    .getTransactionCount(addr)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.log(error);
      next(error);
    });
}

function getRawTransaction(nonce, data, HashId) {
  console.log(nonce, data, HashId);
  var rawTransaction = {
    from: addr,
    gasPrice: web3.utils.toHex(20 * 1e9),
    gasLimit: web3.utils.toHex(300000),
    to: contractAddr,
    value: "0x0",
    data: contract.methods.newPresc(HashId, data).encodeABI(),
    nonce: web3.utils.toHex(nonce),
  };
	console.log(rawTransaction.gasPrice);
  return rawTransaction;
}

async function signTransaction(rawTransaction) {
  console.log(rawTransaction);
  var transaction = new Tx(rawTransaction, {
   // chainId: "1337",
   // hardfork: "muirGlacier",
   // networkId: "5777"
   chain: "ropsten",
   hardfork: "petersburg"
  });
  //signing transaction with private key
  await transaction.sign(Buffer.from(pk, "hex"));
  return transaction;
}

async function send(transaction) {
	console.log(transaction);
  return await web3.eth
    .sendSignedTransaction("0x" + transaction.serialize().toString("hex"))
    .then((res) => {
      return res;
    })
    .catch((err) => {
      return err;
    });
}

async function get_presc(id) {
	//const contractAddr = config.get("contractAddr");
//	var contract = new web3.eth.Contract(abi, contractAddr);
	console.log("i am in get presc");
	var out;
    await contract.methods
      .prescription(id)
      .call()
      .then(async (result) => {
      	console.log("i am in get contract");
      	console.log(await JSON.parse(result));
      	out = await JSON.parse(result);
      	console.log(out);
      	console.log("i am in next to out");
      });
      //console.log(out);
      return out;
}

module.exports = {
  getTransactionCount,
  getRawTransaction,
  signTransaction,
  get_presc,
  send,
};