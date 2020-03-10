exports = module.exports = function number(id) {
    return {
        data: 0,
        default: 0,
        id,
        identicalId: Symbol('blob')
    }
}