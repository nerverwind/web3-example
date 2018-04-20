'use strict';

class ContractWraper {
    constructor(web3, contractAddress, contractAbi) {
        this.web3 = web3;
        this.contract = new this.web3.eth.Contract(contractAbi, contractAddress);

        this.suffix = 'EstimateGas';    
        this.instance = {
            method: [
                'transfer', 
                'transferFrom',
                'approve'
            ]
        }

        for(let key in this.instance) {   
            this.instance[key].forEach((method, index) => {
                this[method + this.suffix] = (...args) => this.__defaultEstimateGas(method, ...args)
            })
        }        

    }

    async __defaultEstimateGas(method, maxGas, data, ...args) {  
        var contractMethod = this.contract.methods[method];
        var gasUsed = maxGas;
        try{
            gasUsed = await contractMethod(...args).estimateGas(data);
            gasUsed = gasUsed > maxGas ? maxGas : gasUsed;
        }
        catch(e) {
        }
        
        return gasUsed;
    }    

    async balanceOf(address) {
        return await this.contract.methods.balanceOf(address).call();
    }
    
}

module.exports = ContractWraper;