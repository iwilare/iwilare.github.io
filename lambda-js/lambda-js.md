# Writing a minimal JavaScript interpreter for λ‑calculus in less than 60 characters

This post takes inspiration from the wonderful article [The smallest lambda interpreter in JavaScript](http://m1el.github.io/smallest-lambda-eval/) and the related video [William Byrd on "The Most Beautiful Program Ever Written"](https://www.youtube.com/watch?v=OyfBQmvr2Hc).
I decided to try writing myself such a minimalistic interpreter in plain JavaScript, and try to golf my way through it.

## Rules

1. The structure of terms is limited to plain JSON structures (i.e.: cyclic objects, closures, or built-in functions are excluded)
2. The syntax should be able to consistently represent the three fundamental kinds of terms in λ‑calculus: variables, applications, and abstractions.
3. Evaluation must take care of bound and unbound variables appropriately, without creating semantic-breaking substitutions (e.g. capturing free variables).

Since there are no restrictions on the input structure as long as it is plain data, both [de Bruijn indices](https://en.wikipedia.org/wiki/De_Bruijn_index) and classic named variables are allowed.

## Original version

Initially, I wanted to see if I could strip down the original code from the blog. There are many obvious size optimizations that can be done on this code:

```js
// Credit to http://m1el.github.io/smallest-lambda-eval/
function Eval(prog, env) {
    if (typeof prog === 'number') {
        // lookup a variable
        while(--prog) { env = env[1]; }
        return env[0];
    } else if (prog[0] === 0) {
        // constructing a new lambda
        return (arg) => Eval(prog[1], [arg, env]);
    } else {
        // function application
        return Eval(prog[0], env)(Eval(prog[1], env));
    }
}
```

The original author also applied an initial syntactic reduction, without performing any significant semantic changes:

```js
// Credit to http://m1el.github.io/smallest-lambda-eval/
Eval = function E(p, e) {
 if (typeof p=='number'){while(--p){e=e[1]}return e[0]}
 return p[0]==0?(a)=>E(p[1],[a,e]):E(p[0],e)(E(p[1],e))
}
```

For reference, the representation they use is with variables as plain numbers representing de Bruijn indices starting from 1. The expression `[0, <body>]`{.js} represents λ-abstractions, and `[<function>, <argument>]`{.js} represents applications.

Their initial desire is to be able to minify the snippet to less than 140 in order to publish it on Twitter. Unfortunately, the code as-is reaches 142 characters, and does not fit in a tweet.

We will try and see if we can improve this.

## Initial reduction

In our code, the variable names use `e`{.js} for "expression" and `Γ`{.js} for the environment, mirroring in the latter case its classic use in type theory as type context.

Let's first minify the code with some easy syntactic simplifications. First, we can take out unneeded spaces, and then rename `Eval`{.js} to its shorter version `E`{.js}. Note that we can easily take out the `function`{.js} by using an ES6 lambda expression:

```js
E=(e,Γ)=>{if(typeof e=='number'){while(--e){Γ=Γ[1]}return Γ[0]}return e[0]==0?(a)=>E(e[1],[a,Γ]):E(e[0],Γ)(E(e[1],Γ))}
```

We can now try doing our first semantic reductions of the code. We can shorten the is-number type check using the fact that `+e`{.js} converts objects into the falsey value `NaN`{.js} but leaves numbers untouched. This works in the case of application and abstraction, since they are represented either with arrays or objects and therefore will be considered as `NaN`{.js}. We can also exploit the fact that, in JavaScript as in C, `e==0`{.js} is logically equivalent to `!e`{.js} when `e`{.js} is a number. These two simplifications allow us to reach *97 characters*:

```js
E=(e,Γ)=>{if(+e){while(--e){Γ=Γ[1]}return Γ[0]}return e[0]?E(e[0],Γ)(E(e[1],Γ)):x=>E(e[1],[x,Γ])}
```

As a first important reduction analysis, we can notice how the major obstacle in compressing the snippet is the first line of the original function, with the explicit use of the `while`{.js} and `return`{.js} keywords.
This looping seems to be quite intrinsic to the structure of the lambda representation itself, since we need to shrink down the environment on its second element of the tuple in order to get the desired de Bruijn index.

The first idea I had was to inline the loop as an argument of the function itself, while recursively decreasing the argument (and the environment) if we can verify that it's a number. In expanded code:

```js
E = (e,Γ) => {
    if(e == 1)
        return Γ[0]
    else if(e > 0)
        return E(e-1, Γ[1])
    else if(e[0] == 0)
        return a => E(e[1], [a, Γ])
    else
        return E(e[0], Γ)(E(e[1], Γ))
}
```

Which can be inlined as follows by just using ternary operators:

```js
E=(e,Γ)=>e==1?Γ[0]:e>0?E(e-1,Γ[1]):e[0]==0?a=>E(e[1],[a,Γ]):E(e[0],Γ)(E(e[1],Γ))
```

We can apply some simple equivalences to further reduce it. By reusing the is-number checking trick we applied earlier, we can replace `e>0`{.js} with `+e`; since `+e`{.js} also checks that `e`{.js} is a number, we can move `e>0`{.js} inside the first branch.

```js
E=(e,Γ)=>+e?e==1?Γ[0]:E(e-1,Γ[1]):e[0]==0?x=>E(e[1],[x,Γ]):E(e[0],Γ)(E(e[1],Γ))
```

In the internal expression, we can invert the ternary operator logic by swapping the branches and using the fact that in JavaScript, when `e`{.js} is a number, `e==0`{.js} is equivalent to verify that `e`{.js} is falsey:

```js
E=(e,Γ)=>+e?e==1?Γ[0]:E(e-1,Γ[1]):e[0]?E(e[0],Γ)(E(e[1],Γ)):x=>E(e[1],[x,Γ])
```

And then, since the indexes start from 1 and are never 0:

```js
E=(e,Γ)=>+e?e<2?Γ[0]:E(e-1,Γ[1]):e[0]?E(e[0],Γ)(E(e[1],Γ)):x=>E(e[1],[x,Γ])
```

In the first branch we actually just need the decremented index, to be used in the immediately recursive call. By decrementing the variable already in the check, we can verify if `e`{.js} is 1 and at the same time have it decreased for the next call.

```js
E=(e,Γ)=>+e?--e?E(e,Γ[1]):Γ[0]:e[0]?E(e[0],Γ)(E(e[1],Γ)):x=>E(e[1],[x,Γ])
```

We can simplify the representation of the input by using objects and fields instead of arrays, in order to reduce field lookup to a minimum size:

```js
E=(e,Γ)=>+e?--e?E(e,Γ[1]):Γ[0]:e.f?E(e.f,Γ)(E(e.x,Γ)):x=>E(e.λ,[x,Γ])
```

This requires us to change the representation of the lambda terms to instead use an equivalent one with objects. We'll represent applications as objects havings two fields `f`{.js} and `x`{.js} with the usual meaning of function and argument, and λ-abstractions as objects having a field `b`{.js} with the body. As before, variables are numbers representing de Bruijn indices starting from one.
Note that we don't do the same with the environment, since creating the object takes much more space. This would in any case nullify what we gained from shortening the field access: compare `{v:x,e:Γ}`{.js} with `[x,Γ]`{.js}.

This brings us at *69 characters*.

## Named representation, with objects and lambdas

I then tried to temporarily scrap the de Bruijn indices to see if the usual named representation approach could take us any further, since the variable lookup doesn't need to iterate through the environment and can be done with a direct lookup.

Switching to a named representation requires us to rethink the environment: inspired by the [William Byrd lecture](https://www.youtube.com/watch?v=OyfBQmvr2Hc), the first thing I thought of was trying to use the higher-order representation for the environment logic, since it seemed to be quite compact. The environment is simply extended by a lambda that checks if the variable looked up is the same as the new one given, and if not, it defers the lookup to the underlying outer environment.
We can now get the value of a variable in the environment with a direct lookup using `Γ(e)`{.js}, instead of having to reduce the environment step by step. This syntax incredibily helps with the character count, since we don't need the iteration logic nor the recursive lookup mechanism.

The code with the environment-augmented lambda now looks like this:

```js
E = (e,Γ) => {
    if(e > 0)
        return Γ(e)
    else if(e.f !== undefined)
        return E(e.f, Γ)(E(e.x, Γ))
    else
        return x => E(e.b, (v) => v==e.λ ? x : Γ(v))
}
```

Which can then be inlined to:

```js
E=(e,Γ)=>e>0?Γ(e):e.f?E(e.f,Γ)(E(e.x,Γ)):x=>E(e.b,v=>v==e.λ?x:Γ(v))
```

Applying the same `+e`{.js} trick as we did in the beginning:

```js
E=(e,Γ)=>+e?Γ(e):e.f?E(e.f,Γ)(E(e.x,Γ)):x=>E(e.b,v=>v==e.λ?x:Γ(v))
```

At first glance, this seemed to me like a pretty good ending point. So I very naïvely thought that it could not be compressed any further, included it in any bio description I could think of, and then left the project there on *2019 December 7th*.

I decided to pick it up again on *2020 January 10th* to see if I could, admittedly quite hopelessly, try to golf it down even more.
To my own surprise, I noticed that we can quite trivially shorten the equality check in the new environment using a simple subtraction, since we can force `v`{.js} and `e.λ`{.js} in our representation to be numbers, used as variable names. Technically, this must then use a different representation that only allows variable names to be numbers instead of strings; but now we can check equality with subtraction, stripping down one more character:

```js
E=(e,Γ)=>+e?Γ(e):e.f?E(e.f,Γ)(E(e.x,Γ)):x=>E(e.b,v=>v-e.λ?Γ(v):x)
```

Later that evening, I tried tackling this expression again to see if I could find a way to express the environment representation more succintly and move away from the lambda-based environment. This can be done for example with an array or an object, in order to maintain the same short 4-characters direct access and simply switch from `Γ(e)`{.js} to `Γ[e]`{.js}. I tried thinking about how I could work on this by using some sort of (immutable) object extension that inserts a value; I then noticed that we can use an object as our environment, and then extend it using the spread notation with the previous one. I just needed to find a way to inject a variable key (since the user-selected variable name is contained in `e.λ`{.js}) within the object in a compact way, and sure enough, JavaScript has an intuitive (and a bit obscure) answer for this: the syntax `{[name]: value}`{.js} with `name`{.js} being a variable containing the key.

```js
E=(e,Γ)=>+e?Γ[e]:e.f?E(e.f,Γ)(E(e.x,Γ)):x=>E(e.b,{...Γ,[e.λ]:x})
```

This final change in environment brings us to *64 characters*.

## Back to de Bruijn indices, with arrays

Inspired by this improvement, I tried doing a similar thing with arrays instad of objects: if we extend the environment by using again to the spread notation `[x,...Γ]`{.js}, something remarkable happens. It turns out that we *inadvertently* return to the de Bruijn indices! This is because of the fact that now variables are again expressed naturally as indices relative to their depth within the abstraction, since we progressively append them at the beginning of the array. We now need to modify our representation in terms of variable names, since they'll be relative indices in the environment instead of "absolute" keys. Since we won't need to be referring to the abstraction variable `e.λ`{.js} anymore, we can reuse it to indicate the body of the abstraction, for purely aesthetic reasons.

This method, however, has its drawbacks.

- Now that the environment is an array, indexing it necessarily must use indices starting from zero. This requires to change our representation again, since we've been using indices starting from one. However, by doing so, we lose the possibility to quickly check if the argument is a number: `+e`{.js} evaluates to false if `e`{.js} is zero, so our code will think that we are dealing with a structure and not with a numeric value. This does not have a difficult solution, since we can move all the checks for object fields at the beginning, and leaving the numerical case at the end; we do have to spend one extra character, though.
(There is also another solution which involves decreasing `e`{.js} when accessing the environment and leaving the rest untouched. Unfortunately, it is longer by 1 character.)

```js
E=(e,Γ=[])=>+e?Γ[e-1]:e.f?E(e.f,Γ)(E(e.x,Γ)):x=>E(e.λ,[x,...Γ])
```

- For all the previous types of environment, we could always allow the function to have its environment `Γ`{.js} as `undefined`{.js}, since it didn't really alter the behaviour of the code except in the case of errors and badly-formed expressions. But now if we have `Γ`{.js} as `undefined`{.js} and then we try to extend it with `[x,...Γ]`{.js}, we unfortunately encounter the error `Uncaught TypeError: undefined is not iterable`{.js}.
This again does not have a difficult solution, but it does take away some bytes, since we need to specify `Γ=[]`{.js} at the beginning of the function. Note that we need to specify an iterable object: the shorter possibility of giving a smaller object `0`{.js} would not work.

By combining these two points, we finally get:

```js
E=(e,Γ=[])=>e.f?E(e.f,Γ)(E(e.x,Γ)):e.λ?x=>E(e.λ,[x,...Γ]):Γ[e]
```

This gets us to 2 characters less than the previous solution with objects and lambdas.

However, our use of object fields made me wonder if we could change the term representation to, in a way, better "encapsulate" all the possible term cases. I then remembered the existence of *array pattern matching* in JavaScript.

## Pattern matching

Array pattern matching can be used in function arguments `([a,b],c) => ...`{.js} to automatically take and give names to the two "sub-elements" of the array structure given as argument. This allows us to circumvent the need to use field names to access the various parts of the expression.

The crucial point is that, in fact, this representation is all that we really need to be able to represent the entirety of our expression cases:
- we can represent `[n, null]`{.js} as a variable with a zero-indexed de Bruijn index `n`{.js},
- use `[null, b]`{.js} to indicate the λ-abstraction with body `b`{.js} (where b is another non-`null`{.js} lambda term using this same format),
- and finally represent application with both the two fields occupied, expressing it with `[f, x]`{.js} where `f`{.js} and `x`{.js} are both two non-`null`{.js} values indicating the function and the argument of the application.

(Although non essential, we can, as an aid in our representation of terms, use `[a,]`{.js} as shorthand for `[a, undefined]`{.js}, and similarly `[,a]`{.js} as shorthand for `[undefined, a]`{.js}. Even though `undefined`{.js} is strictly speaking not part of the JSON standard, we can use it as an equivalent form for `null`{.js}.)

The choice in the position of the arguments for the λ-abstraction is motivated by the fact that `[, [, [, [, ... ]]]]`{.js} nicely parses into a series of λ-abstractions in the way we expect.

Semantically, the checks also further simplify, since we don't need to check for numbers nor object fields being truthy, and we can instead act directly on the two named array elements to check if they are `undefined`{.js}.

Here is the final code:

```js
E=([a,b],Γ=[])=>b?a?E(a,Γ)(E(b,Γ)):x=>E(b,[x,...Γ]):Γ[a]
```

This brings us to a very surprising reduction with just *56 characters*!

## Conclusion

It feels that we (finally) reduced everything to its truly barebones representation. I sincerely had no idea I would have ended up with such a simplification, especially considering that every single reduction felt like that was it, there was no further possible way of taking away any more characters.

This last snippet highlights the fundamental concepts of λ‑calculus interpretation, both in its minimal syntax:

- variables,    `[a,]`{.js}
- abstractions, `[,b]`{.js}
- applications, `[a,b]`{.js}

and in its naturally corresponding semantics:

- variables and environment lookup,       `Γ[a]`{.js}
- abstractions and environment extension, `x=>E(b,[x,...Γ])`{.js}
- applications and recursive evaluation,  `E(a,Γ)(E(b,Γ))`{.js}

You can consult the files of this small development at [lambda.js](lambda.js) and [lambda-all.js](lambda-all.js).

*Thank you for reading. Please tell me if you have any further suggestions to improve this!*
