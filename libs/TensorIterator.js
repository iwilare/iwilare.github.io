function TensorIterator(dimensions, body, applyArray = false) {
    let state = new Array(dimensions.length).fill(0)

    for(let depth = 0; depth >= 0 && state[depth] < dimensions[depth];) {
        if(depth < dimensions.length-1)
            depth++
        else {
            const stop = applyArray ? body(state) : body(...state)
            if(stop)
                return
            state[depth]++
        }
        while(depth >= 0 && state[depth] == dimensions[depth]) {
            state[depth] = 0
            depth--
            if(depth >= 0)
                state[depth]++
        }
    }
}

function TensorArrayIterator(array, dimensions, body, applyArray = false) {
    let state = new Array(dimensions.length).fill(0)
    let i = 0

    for(let depth = 0; depth >= 0 && state[depth] < dimensions[depth];) {
        if(depth < dimensions.length-1)
            depth++
        else {
            if(i < array.length) {
                const stop = applyArray ? body(array[i++], state) : body(array[i++], ...state)
                if(stop)
                    return
            } else
                return
            state[depth]++
        }
        while(depth >= 0 && state[depth] == dimensions[depth]) {
            state[depth] = 0
            depth--
            if(depth >= 0)
                state[depth]++
        }
    }
}