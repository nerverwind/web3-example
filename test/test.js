var chai = require('chai');
var assert = chai.assert;

var Tx = require('../lib/tx');
var tx = new Tx();

describe('web3 demo tx test', function(){
    it('get ether balance', async function(){
        var bal = await tx.getEhterBal('0x34847f3273EbA2C8BC3e98A589CC27a70E739F1A');
        console.log(bal);
    });

    it('get token balance', async function(){
        var bal = await tx.getTokenBal('0x34847f3273EbA2C8BC3e98A589CC27a70E739F1A');
        console.log(bal);
    });

    it('send ether', async function(){
        
        var keystore = '';
        var password = '';

        //转一个eth
        //value可以通过web3.eth.toWei来确定 
        //web3.eth.toWei('1') 

        await tx.transferEther(keystore, password, '0x689f0fb31c38354832bCaaB4b7BE29CB59Ab2c6D', '1000000000000000000');

    });

    it('send token', async function() {

        var keystore = '';
        var password = '';        

        var value = '10000000'; //转账金额 * token精度
        await tx.tokenTransfer(keystore, password, '0x689f0fb31c38354832bCaaB4b7BE29CB59Ab2c6D', value);

    });

});