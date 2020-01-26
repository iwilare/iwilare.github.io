// 1-index De Bruijn, [0,n] abstraction, [f,x] application
let repr1 = [0, [[1, [0, [0, [0, [[3, 1], [2, 1]]]]]], [0, [0, 2]]]]
// 1-index De Bruijn, {f:, x:} application, {λ:} abstraction
let repr2 = {λ:       {f: {f: 1, x: {λ:       {λ:       {λ:       {f: {f: 3, x: 1}, x: {f: 2, x: 1}}}}}}, x: {λ:       {λ:       2}}}}
// Named,             {f:, x:} application, {λ:, b:} abstraction
let reprN = {λ: 1, b: {f: {f: 1, x: {λ: 2, b: {λ: 3, b: {λ: 4, b: {f: {f: 2, x: 4}, x: {f: 3, x: 4}}}}}}, x: {λ: 2, b: {λ: 3, b: 2}}}}
// 0-index De Bruijn, {f:, x:} application, {λ:} abstraction
let reprF = {λ:       {f: {f: 0, x: {λ:       {λ:       {λ:       {f: {f: 2, x: 0}, x: {f: 1, x: 0}}}}}}, x: {λ:       {λ:       1}}}}
// 0-index De Bruijn, {t:1, f:, x:} application, {t:0, λ:} abstraction
let reprT = {t:0,λ: {t:1,f: {t:1,f: 0, x: {t:0,λ: {t:0,λ: {t:0,λ: {t:1,f: {t:1,f: 2, x: 0}, x: {t:1,f: 1, x: 0}}}}}}, x: {t:0,λ: {t:0,λ: 1}}}}
// 0-index De Bruijn, [index,] term, [,body] abstraction, [function, argument] application
let reprZ = [,        [   [  [0,],  [,        [,        [,        [   [  [2,], [0,]],  [  [1,], [0,]]]]]]],  [,        [,       [1,]]]]]

let tests = 
    [ [repr1, () => { E=(e,Γ)=>{if(typeof e=='number'){while(--e){Γ=Γ[1]}return Γ[0]}return e[0]==0?(a)=>E(e[1],[a,Γ]):E(e[0],Γ)(E(e[1],Γ))} ;return E }]
    , [repr1, () => { E=(e,Γ)=>{if(+e){while(--e){Γ=Γ[1]}return Γ[0]}return e[0]?E(e[0],Γ)(E(e[1],Γ)):x=>E(e[1],[x,Γ])} ;return E }]
    , [repr1, () => { E=(e,Γ)=> {
                        if(e == 1)
                            return Γ[0]
                        else if(e > 0) 
                            return E(e-1, Γ[1])
                        else if(e[0] == 0)
                            return a => E(e[1], [a,Γ])
                        else
                            return E(e[0], Γ)(E(e[1], Γ))
                    }
                    ;return E}]
    , [repr1, () => { 
E=(e,Γ)=>e==1?Γ[0]:e>0?E(e-1,Γ[1]):e[0]==0?a=>E(e[1],[a,Γ]):E(e[0],Γ)(E(e[1],Γ))                  ;return E }]
    , [repr1, () => { 
E=(e,Γ)=>+e?e==1?Γ[0]:E(e-1,Γ[1]):e[0]==0?x=>E(e[1],[x,Γ]):E(e[0],Γ)(E(e[1],Γ))                   ;return E }]
    , [repr1, () => { 
E=(e,Γ)=>+e?e==1?Γ[0]:E(e-1,Γ[1]):e[0]?E(e[0],Γ)(E(e[1],Γ)):x=>E(e[1],[x,Γ])                      ;return E }]
    , [repr1, () => { 
E=(e,Γ)=>+e?--e?E(e,Γ[1]):Γ[0]:e[0]?E(e[0],Γ)(E(e[1],Γ)):x=>E(e[1],[x,Γ])                         ;return E }]
    , [repr2, () => { 
E=(e,Γ)=>+e?--e?E(e,Γ[1]):Γ[0]:e.f?E(e.f,Γ)(E(e.x,Γ)):x=>E(e.λ,[x,Γ])                             ;return E }]
    , [reprN, () => {                                                                             
E=(e,Γ)=>e>0?Γ(e):e.f?E(e.f,Γ)(E(e.x,Γ)):x=>E(e.b,v=>v==e.λ?x:Γ(v))                               ;return E }]
    , [reprN, () => { 
E=(e,Γ)=>+e?Γ(e):e.f?E(e.f,Γ)(E(e.x,Γ)):x=>E(e.b,v=>v==e.λ?x:Γ(v))                                ;return E }]
    , [reprN, () => { 
E=(e,Γ)=>+e?Γ(e):e.f?E(e.f,Γ)(E(e.x,Γ)):x=>E(e.b,v=>v-e.λ?Γ(v):x)                                 ;return E }]
    , [reprN, () => { 
E=(e,Γ)=>+e?Γ[e]:e.f?E(e.f,Γ)(E(e.x,Γ)):x=>E(e.b,{...Γ,[e.λ]:x})                                  ;return E }]
    , [repr2, () => { 
E=(e,Γ=[])=>+e?Γ[e-1]:e.f?E(e.f,Γ)(E(e.x,Γ)):x=>E(e.λ,[x,...Γ])                                   ;return E }]
    , [reprF, () => { 
E=(e,Γ=[])=>e.λ?x=>E(e.λ,[x,...Γ]):Γ[e]||E(e.f,Γ)(E(e.x,Γ))                                       ;return E }]
    , [null,  () => { 
E=([a,b],Γ=[])=>b?Γ[e]||E(a,Γ)(E(b,Γ)):x=>E(e[2],[x,...Γ])                                        ;return E }]
    , [null,  () => { 
E=([a,b,c],Γ=[])=>b?Γ[e]||E(a,Γ)(E(b,Γ)):x=>E(c,[x,...Γ])                                         ;return E }]
    , [reprZ, () => { 
E=([a,b],Γ=[])=>b?a?E(a,Γ)(E(b,Γ)):x=>E(b,[x,...Γ]):Γ[a]                                          ;return E }]
    ]
    
function test() {
    tests.forEach(([testStructure, evalSupplier], i) => 
        testStructure == null ? null : testFunctionality(i, evalSupplier()(testStructure)))
}
function testFunctionality(i, iota) {
    let I = iota(iota)
    let K = iota(iota(iota(iota)))
    let S = iota(iota(iota(iota(iota))))

    console.assert(I("test")            === "test",  i + "a")
    console.assert(K("first")("second") === "first", i + "b")
    console.assert(S(K)(K)("test")      === "test",  i + "c")
}
test()