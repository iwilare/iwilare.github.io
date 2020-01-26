Math.TAU = 2 * Math.PI

const n = null
const NumpadCalculator = [
    [7, 8, 9],
    [4, 5, 6],
    [1, 2, 3],
    [n, 0, n]
]
const NumpadPhone = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [n, 0, n]
]

function Numpad(svg, path, size, numpadStructure, widthPercentage = 1/5, junctionColor = '#0066CC', pathColor = '#111111', circleColor = '#AAAAAA', startCircleColor = 'red') {
    let box = svg.group()

    const numpadCoordinates = createNumpadCoordinates(numpadStructure, size)
    const sequence = createSequence(path)
    const coordinates = sequence.map(n => numpadCoordinates[n.value])

    const doubleEnd = sequence[sequence.length-1].weight == 2

    if(doubleEnd)
        sequence[sequence.length-1].weight = 1

    drawPoints(numpadCoordinates, box, size, circleColor)
    drawPath(box, coordinates, size, widthPercentage, pathColor)
    drawStartCircle(box, size, coordinates, startCircleColor)
    drawPathEnd(box, size/3 * 1.5, coordinates[coordinates.length-1], coordinates[coordinates.length-2], doubleEnd ? junctionColor : pathColor)
    drawMultiplePoints(sequence, numpadCoordinates, box, size, junctionColor)
    drawDigitsLabel(box, path, size, size/2.5)

    return box
}

function createNumpadCoordinates(numpadStructure, size) {
    let numpadCoordinates = new Array(10)
    numpadStructure.forEach((row, i) => {
        row.forEach((n, j) => {
            if(n !== undefined)
                numpadCoordinates[n] = [size * j, size * i]
        })
    })
    return numpadCoordinates
}

function triangle(svg, side) {
    return svg.group()
              .polyline([
                  [0, 0],
                  [-side / 2, 0],
                  [0, -side * Math.sqrt(3) / 2],
                  [side / 2, 0]
              ])
}

function junction(svg, side, number, junctionColor) {
    let junction = svg.group()
    junction.circle(side).fill(junctionColor)
    if(number > 2)
        junction.text('' + number)
                .fill('#FFFFFF')
                .font({
                    size: side * 2/3
                })
                .center(side/2, side/2)
    return junction
}

function drawPoints(numpadCoordinates, box, size, circleColor) {
    for(let [x, y] of numpadCoordinates)
        box.circle(size/3)
           .center(x, y)
           .fill(circleColor)
}

function createSequence(path) {
    let sequence = []
    let multi = 1
    let last = null
    path.forEach(n => {
        if(n == last)
            multi++
        else if(last != null) {
            sequence.push({
                value: last,
                weight: multi
            })
            multi = 1
        }
        last = n
    })
    sequence.push({
        value: last,
        weight: multi
    })
    return sequence
}

function drawPath(box, coordinates, size, widthPercentage, pathColor) {
    box.polyline(coordinates)
       .fill('none')
       .stroke({
           width: size * widthPercentage,
           linecap: 'round',
           linejoin: 'round',
           color: pathColor
       })
}

function drawPathEnd(box, size, [lx, ly], [px, py], pathColor) {
    triangle(box, size)
        .center(lx, ly)
        .rotate(360/Math.TAU * (-Math.TAU/4 + Math.atan2(-ly + py, -lx + px)), lx, ly)
        .fill(pathColor)
}

function drawDigitsLabel(box, path, size, textSize) {
    box.text(path.reduce((a, x) => a + x, ''))
       .font({
           size: textSize
       })
       .center(size, 3.5 * size)
}

function drawMultiplePoints(sequence, numpadCoordinates, box, size, junctionColor) {
    sequence.forEach(v => {
        let [x, y] = numpadCoordinates[v.value]
        if(v.weight > 1)
            junction(box, size/3, v.weight, junctionColor).center(x, y)
    })
}

function drawStartCircle(box, size, coordinates, startCircleColor) {
    box.circle(size*1.3/3)
       .center(...coordinates[0])
       .fill(startCircleColor)
}