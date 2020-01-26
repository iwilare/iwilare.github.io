function SvgDesk(svg, element, borderPercentage=0.0) {
    const bbox = svg.bbox()
        , size = Math.min(window.innerHeight, window.innerWidth)
        , width = bbox.width
        , height = bbox.height
        , border = size * borderPercentage
        , leftBorder = (window.innerWidth - width)/2
    element.move(leftBorder, border)
    svg.size(width + svg.bbox().x, height + svg.bbox().y + border)
}