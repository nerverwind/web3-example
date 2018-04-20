'use strict';

class InputDataEncoder {
    constructor(web3){
        this.web3 = web3;
        this.__init();
    }

    __init(){
        this.__initDefaults();
        this.__initMethods();
    }

    __initDefaults() {
        
        this.suffix = 'DataEncode';
        this.instanceSource = {
            method: [
                'transfer', 
                'transferFrom',
                'approve'
            ]
        }
    }    

    __initMethods() {
        for(let key in this.instanceSource) {   
            this.instanceSource[key].forEach((method, index) => {
                this[method + this.suffix] = (...args) => this.__defaultDataEncode(method, ...args)
            })
        }
    }      
    
    //method - 合约方法(如: approve)
    //abi - contract abi 对象
    //data - 数组, 合约方法的输入值, 数组值的顺序要跟合约方法输入项的顺序匹配
    __defaultDataEncode(method, abi, data) {
        var that = this;
        var encodeData = null;
        var contractAbiMethods = abi.filter(abiMethod => {
            return abiMethod.name == method;
        })

        try{
            if(contractAbiMethods && contractAbiMethods.length > 0){
                var contractAbiMethod = contractAbiMethods[0];
                var encodeFunctionParams = {
                    "name": contractAbiMethod.name,
                    "type": contractAbiMethod.type,
                    "inputs": contractAbiMethod.inputs,
                };
                encodeData = that.web3.eth.abi.encodeFunctionCall(encodeFunctionParams, data);
            }
        }
        catch(e){
            that.logger.error(method + this.suffix, e);
        }

        return encodeData;
    }
}

module.exports = InputDataEncoder;