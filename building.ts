type PromsiseResolve<T> = (value : T)=>void;

type PromsiseReject<T> = (reason : T)=>void;

type PromiseExecutor<T, K> = (resolve: PromsiseResolve<T>, reject:PromsiseReject<K>) => void;

type PromiseThen<T> = (value:T | undefined)=> void;
type PromiseCatch<T> = (reason:T | undefined)=> void;
type PromiseFinally= ()=> void;

enum PromiseState{
    PENDING = 'pending',
    FULFILLED = 'fulfilled',
    REJECTED = 'rejected'
}

class MyPromise<T, K>{
    private _state: PromiseState = PromiseState.PENDING
    
    private _successCallbackHandler : PromiseThen<T>[]= [];
    private _failureCallbackHandler : PromiseCatch<K>[]= [];
    private _finallyCallbackHandler : PromiseFinally | undefined = undefined;
    private _value : T | undefined = undefined;
    private _reason : K | undefined = undefined;

    constructor(executor : PromiseExecutor<T, K>){ //executor function
        executor(this._promiseResolver.bind(this), this._promiseRejector.bind(this));
    }   

    public then(handlerFn: PromiseThen<T>){
        if(this._state===PromiseState.FULFILLED){
            handlerFn(this._value);
        }
        else{
            this._successCallbackHandler.push(handlerFn);
        }     
        return this;
    }

    public catch(handlerFn: PromiseCatch<K>){
        if(this._state === PromiseState.REJECTED){
            handlerFn(this._reason);
        }
        else{
            this._failureCallbackHandler.push(handlerFn);
        }
        return this;
    }

    public finally(handlerFn:PromiseFinally){
        if(this._state!==PromiseState.PENDING){
            return handlerFn();
        }
        this._finallyCallbackHandler = handlerFn;

    }

    private _promiseResolver(value : T){
        if (this._state === PromiseState.FULFILLED) return;
        this._state = PromiseState.FULFILLED;
        this._value = value;
        this._successCallbackHandler.forEach(cb=>cb(value));
        if(this._finallyCallbackHandler){
            this._finallyCallbackHandler();
        }
    }

    private _promiseRejector(reason : K){
        if (this._state === PromiseState.REJECTED) return;
        
        this._state = PromiseState.REJECTED;
        this._reason = reason; 
        this._failureCallbackHandler.forEach(cb=>cb(reason));
        if(this._finallyCallbackHandler){
            this._finallyCallbackHandler();
        }
    }
}

const waitFor = (s: number) => new MyPromise<number, number>((res, rej)=>{
    setTimeout(()=>res(s), s*1000);
});

function customPromise(){
    return new MyPromise<string, string>((res, rej)=>{
        rej('Okay');
    });
}

customPromise().then(()=> console.log('Custom Done')).catch((reason)=>{
    console.log("Rejected Because", reason);
    
})

waitFor(5)
.then((value)=>{
    console.log(`Promise Resolve`, value);
})
.catch((reason)=>{
    console.log('Rejected', reason);
})
.finally(()=>{
    console.log('All Good');
});