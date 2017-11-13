
const fs = require('fs')
const solc = require('solc')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

// Compile the source code
const input = fs.readFileSync('./contracts/WrapperLock.sol')
const output = solc.compile(input.toString(), 1)
const bytecode = output.contracts[':WrapperLock'].bytecode
const abi = JSON.parse(output.contracts[':WrapperLock'].interface)

// Contract object
const accountContract = web3.eth.contract(abi)

const theData = accountContract.new.getData('0xAB8546b90Af4E644F7662CDbde226a73Bc0c17f3', 'Test Wrapper', 'TTW', 18,
    {
         from: web3.eth.accounts[0],
         data: bytecode,
         gas: '300000',
         gasPrice: '4000000000'
    })
console.log(theData)
