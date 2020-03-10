exports = module.exports = function optionalNumber(id) {
    return {
        data: 0,
        default: undefined,
        id,
        identicalId: Symbol('blob')
    }
}