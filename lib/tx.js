'use strict';

var Web3 = require('web3');
var web3 = new Web3('http://localhost:8545');

var InputDataEncoder = require('./input-data-enconder');
var ContractWrapper = require('./contract-wraper');

//token 合约地址
const contractAddress = '0x1a8eE19D35dc954AC7f705Ce78Cc6Ce4026cd060';
//token 合约ABI对象(JsonInterface)
const contractABI = [{"constant":true,"inputs":[],"name":"mintingFinished","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"startTrading","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tradingStarted","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"finishMinting","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[],"name":"MintFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}];

class Tx {
    constructor() {
        this.inputDataEncoder = new InputDataEncoder(web3);
        this.contractWraper = new ContractWrapper(web3, contractAddress, contractABI);
    }

    async getEhterBal(accountAddress) {
        var bal = await web3.eth.getBalance(accountAddress);
        //根据精度换算
        var balBN = web3.utils.toBN(bal);
        var BN = web3.utils.BN;

        const decimals = 18
        const decimalsBN = new BN(decimals)
        const divisor = new BN('10').pow(decimalsBN);
        
        const beforeDecimal = balBN.div(divisor);
        const afterDecimal  = balBN.mod(divisor);
        
        var res = {
            before: beforeDecimal.toString(),
            after: afterDecimal.toString()
        }

        return res;
    }

    async getTokenBal(accountAddress) {
        var myContract = new web3.eth.Contract(contractABI, contractAddress);
        var tokenBal = await myContract.methods.balanceOf(accountAddress).call();
        var tokenBalBN = web3.utils.toBN(tokenBal);
        var tokenDecimals = await myContract.methods.decimals().call();
        var BN = web3.utils.BN;
        var baseBN = new BN('10');
        var tokenDecimalsBN = new BN('' + tokenDecimals);
        var decimalsBN = baseBN.pow(tokenDecimalsBN);

        const beforeDecimal = tokenBalBN.div(decimalsBN);
        const afterDecimal  = tokenBalBN.mod(decimalsBN);

        var res = {
            before: beforeDecimal.toString(),
            after: afterDecimal.toString()
        }
        return res;
    }

    loadAccount(keystore, password) {
        var account = null;
        try{
            if('string' === typeof keystore) {
                keystore = JSON.parse(keystore);
            }
            account = web3.eth.accounts.decrypt(keystore, password);
        }
        catch(e){
            console.log(e);
        }

        return account;
    }

    async getAccountTxNonce(accountAddress) {
        return await web3.eth.getTransactionCount(accountAddress, 'pending');
    }

    //以太坊转账
    async transferEther(fromAccountKeystore, fromAccountPassword, to, value) {
        var that = this;
        var account = this.loadAccount(fromAccountKeystore, fromAccountPassword);
        if(account) {
            var rawTx = {//交易报文
                to: to,
                value: web3.utils.toBN(value),
                gas: 210000,
                nonce: await that.getAccountTxNonce(account.address)
            }
            account.signTransaction(rawTx).then(txData => {//交易签名
    
                web3.eth.sendSignedTransaction(txData.rawTransaction)
                .on('transactionHash', function(hash) {
                    //生成交易信息，等待矿工打包
                    console.log(hash);
                })
                .on('receipt', function(receipt) {
                    //矿工已打包等待确认, 可以根据receipt.status判断交易状态
                    console.log(receipt);
                })
                .on('confirmation', function(confirmationNumber, receipt){
                    //收到确认块, 针对一笔交易会发送24个确认，只要有12个确认即表示最终确认
                    console.log(confirmationNumber);
                })
                .on('error', function(error) {
                    //发送交易出错，该错误也可能在transationHash之后抛出
                    console.log(error);
                });
            })
            .catch(console.log);
        }
    }
        
    async tokenTransfer(fromAccountKeystore, fromAccountPassword, toAddress, value) {
        var account = this.loadAccount(fromAccountKeystore, fromAccountPassword);
        if(account) {
            var transferEncodeData = this.inputDataEncoder.transferDataEncode(contractABI, [toAddress, value]);   //打包TOKEN合约交易数据
            if(transferEncodeData){
                //交易组包
                var rawTx = {
                    to: contractAddress, //注意这里，to为合约地址
                    data: transferEncodeData,
                    nonce: await web3.eth.getTransactionCount(account.address, 'pending'),//计算nonce
                };
                //计算gas
                var gasData = {
                    from: account.address
                }                           
                var maxGas = 4000000; //3000000
                var gasUsed = await this.contractWraper.transferEstimateGas(maxGas, gasData, toAddress, value);
                gasUsed = gasUsed + 100000 > maxGas ? maxGas : gasUsed + 100000;
                rawTx['gasLimit'] = '' + gasUsed;     
                account.signTransaction(rawTx).then(txData => {
                    web3.eth.sendSignedTransaction(txData.rawTransaction)
                    .on('transactionHash', function(hash) {
                        //生成交易信息，等待矿工打包
                        console.log(hash);
                    })
                    .on('receipt', function(receipt) {
                        //矿工已打包等待确认, 可以根据receipt.status判断交易状态
                        console.log(receipt);
                    })
                    .on('confirmation', function(confirmationNumber, receipt){
                        //收到确认块, 针对一笔交易会发送24个确认，只要有12个确认即表示最终确认
                        console.log(confirmationNumber);
                    })
                    .on('error', function(error) {
                        //发送交易出错，该错误也可能在transationHash之后抛出
                        console.log(error);
                    });
                })
                .catch(console.log);
            }
        }
    }
    
        
        
}

module.exports = Tx;