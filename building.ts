type PromsiseResolve<T> = (value : T)=>void;

type PromsiseReject<T> = (reason : T)=>void;

type PromiseExecutor<T, K> = (resolve: PromsiseResolve<T>, reject:PromsiseReject<K>) => void;

type PromiseThen<T, R> = (value:T)=> R;
type PromiseCatch<T, R> = (reason:T)=> R;
type PromiseFinally= ()=> void;

enum PromiseState{
    PENDING = 'pending',
    FULFILLED = 'fulfilled',
    REJECTED = 'rejected'
}

class MyPromise<T, K>{
    private _state: PromiseState = PromiseState.PENDING
    
    private _successCallbackHandler : ((value: T)=> void)[]=[];
    private _failureCallbackHandler : ((reason : K)=>void)[] = [];
    private _finallyCallbackHandler : PromiseFinally | undefined = undefined;
    private _value : T | undefined = undefined;
    private _reason : K | undefined = undefined;

    constructor(executor : PromiseExecutor<T, K>){ //executor function
        executor(this._promiseResolver.bind(this), this._promiseRejector.bind(this));
    }   

    public then<R>(
        handlerFn: PromiseThen<T, R>): MyPromise<R, K>{
            return new MyPromise<R, K>((resolve, reject)=>{
                const callback = (value: T)=>{
                    try{
                        const result = handlerFn(value);
                        resolve(result);
                    }
                    catch(error){
                        reject(error as K);
                    }
                };
                if(this._state === PromiseState.FULFILLED){
                    callback(this._value as T);
                }
                else if(this._state === PromiseState.PENDING){
                    this._successCallbackHandler.push(callback);
                }
                else if(this._state === PromiseState.REJECTED){
                    reject(this._reason as K);
                }
            })
        }

    public catch<R>(
        handlerFn: PromiseCatch<K, R>
    ): MyPromise<R, K>{
        return new MyPromise<R, K>((resolve, reject)=>{
            const callback = (reason : K)=>{
                try{
                    const result = handlerFn(reason);
                    resolve(result);
                }
                catch(error){
                    reject(error as K);
                }
            };
            if(this._state === PromiseState.REJECTED){
                callback(this._reason as K);
            }
            else if(this._state === PromiseState.PENDING){
                this._failureCallbackHandler.push(callback);
            }
            else if (this._state === PromiseState.FULFILLED) {
                resolve(this._value as unknown as R);
            }
        });
    }

    public finally(handlerFn:PromiseFinally){
        if(this._state!==PromiseState.PENDING){
            return handlerFn();
        }
        this._finallyCallbackHandler = handlerFn;

        return this;

    }

    private _promiseResolver(value : T){
        if (this._state !== PromiseState.PENDING) return;
        this._state = PromiseState.FULFILLED;
        this._value = value;
        this._successCallbackHandler.forEach(cb=>cb(value));
        if(this._finallyCallbackHandler){
            this._finallyCallbackHandler();
        }
    }

    private _promiseRejector(reason : K){
        if (this._state !== PromiseState.PENDING) return;
        
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

waitFor(2)
.then((value)=>{
    console.log("First:", value);
    return value*2;
})
.then((value)=>{
    console.log("Second:", value);
    return value+10;
})
.then((value)=>{
    console.log("Third:", value);
});