exports = module.exports = function number(id) {
    return {
        data: '',
        default: undefined,
        id,
        identicalId: Symbol('blob')
    }
}