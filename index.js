const HEAD = require("./HEAD")
const version = require("./version")
const {
    isArray,
    isPlainObject,
    get,
    mapValues,
    takeWhile,
    forEach
} = require('lodash')
const {
    set
} = require("lodash/fp")

// path: { type: 'object' | 'array', name: '' }
const defaultData = (() => {
    const data = version[HEAD]

    function getDefaultData(object) {
        if (isPlainObject(object) && typeof object.identicalId === 'symbol') {
            return object.default
        } else if (isPlainObject(object)) {
            return mapValues(object, (value) => getDefaultData(value));
        } else {
            return object.map((value) => getDefaultData(value));
        }
    }
    return getDefaultData(data)
})()


function convertType2KeyValue(path, object) {
    switch (true) {
        case isPlainObject(object) && typeof object.identicalId === 'symbol':
            return {
                [object.id]: path,
            };

        case isPlainObject(object) && typeof object.identicalId !== 'symbol':
            return Object.entries(object).reduce((result, [key, value]) => ({
                ...result,
                ...convertType2KeyValue([...path, key], value)
            }), {});

        case isArray(object):
            return convertType2KeyValue([...path, 0], object[0])

        default:
            return {};
    }
}


function iterationMerge(targetTypeObject, path, sourceKeyValue, targetKeyValue, data, result) {
    const mappingData = (sourcePath, targetPath, data, result) => {
        // sourcePath, targetPath, data 是常量
        // 先结合 sourcePath 和 data -> targetPath, 数据然后投射到result中
        // 会将经过的地方如果没有设置的话设置成默认值
        // 首先将整个sourcePath分成以数组为 separator 的分割数组， 查看在这个路径上是否存在数据
        // * 如果存在 则直接覆盖上更改的数据
        // * 如果不存在则使用默认数据覆盖上， 然后在用data中的数据来overwrite
        // 在两个路径中打上节点
        const getPath = (path, indexList, pathList = []) => {
            if (indexList.length === 0) {
                return [...pathList, ...takeWhile(path, (certainPath) => typeof certainPath === 'string')]
            } else {
                const certainPath = path[0]
                path = path.slice(1)
                if (typeof certainPath === 'number') {
                    return getPath(path, indexList.slice(1), [...pathList, indexList[0]])
                } else {
                    return getPath(path, indexList, [...pathList, certainPath])
                }
            }
        }
        const depth = sourcePath.filter((certainPath) => typeof certainPath === 'number').length
        const pathSet = (targetPath, value, result) => {
            forEach(targetPath, (_, index) => {
                switch (true) {
                    case (index === targetPath.length - 1):
                        result = set(targetPath, value /*?*/ , result);
                        return false

                    case get(result, targetPath.slice(0, index + 1)):
                        break;

                    default: {
                        // 值被默认值铺满
                        const value = paddingDefault(targetPath.slice(0, index + 1))
                        result = set(targetPath.slice(0, index + 1), value, result)
                        break;
                    }
                }
            });
            return result
        }
        const nextPath = (indexList = []) => {
            // 查看第一个是否超出长度， 超出则
            // 如果长度不一致， 则往后衍生至长度一致，就是 + [0]
            // 看indexList的长度是否和sourcePath中number数量一致， 一致且有数据， 则返回
            // 如果下一个不满足条件， 则向前+1，也就是indexList push 一个元素， 然后将最后一个元素 + 1, 看是否超过长度， 超过， 
            const path = getPath(sourcePath, indexList)
            switch (true) {
                case depth === 0 || get(data, path) === undefined && indexList.length === 1:
                    return {
                        success: false
                    };

                case get(data, path) === undefined && indexList.length > 1:
                    indexList = indexList.slice(0, -1)
                    const index = indexList[indexList.length - 1]
                    indexList = [...indexList.slice(0, -1), index + 1]
                    return nextPath(indexList);

                case get(data, path) !== undefined && indexList.length === depth:
                    return {
                        success: true,
                            indexList,
                    };

                case get(data, path) !== undefined && indexList.length < depth:
                    return nextPath([...indexList, 0]);

                default:
                    return {
                        success: false
                    }

            }
        }

        const loopSetData = (result, propsIndexList = []) => {
            // 首先判断是否路径有效， 如果无效直接执行下一个 isValid
            // 如果有效， 则设置值
            // 找下一个
            // 如果下一个就已经没有过了， 直接return result
            // 如果中间没有数组， 则直接跳过， 如果中间有数组则需要
            if (sourcePath.filter((value) => typeof value === 'number').length === 0) {
                return pathSet(getPath(targetPath, []), get(data, sourcePath), result) //?
            }
            const {
                success,
                indexList
            } = nextPath(propsIndexList) //?
            if (success) {
                const value = get(data, getPath(sourcePath /*?*/ , indexList))
                result = pathSet(getPath(targetPath, indexList), value, result) //?
                const lastIndex = indexList[indexList.length - 1]
                return loopSetData(result, [...indexList.slice(0, -1), lastIndex + 1]) //?
            } else {
                return result
            }
        }
        return loopSetData(result)
    }

    const targetType /*?*/ = path.length === 0 ? targetTypeObject : get(targetTypeObject, path)
    result //?
    switch (true) {
        case isPlainObject(targetType) && typeof targetType.identicalId === 'symbol':
            const sourcePath = sourceKeyValue[targetType.id]; //?
            const targetPath = targetKeyValue[targetType.id]; //?
            if (sourcePath && sourcePath.filter((certainPath) => typeof certainPath === 'number').length === targetPath.filter(((certainPath) => typeof certainPath === 'number')).length) {
                return mappingData(sourcePath, targetPath, data, result) //?
            }
            return result;

        case isPlainObject(targetType) && typeof targetType.identicalId !== 'symbol':
            return Object.entries(targetType).reduce((result, [key]) => {
                const a = [...path, key] //?
                return iterationMerge(targetTypeObject, [...path, key], sourceKeyValue, targetKeyValue, data, result) //?
            }, result)

        case isArray(targetType):
            return iterationMerge(targetTypeObject, [...path, 0] /*?*/ , sourceKeyValue, targetKeyValue, data, result)

        default:
            return {};
    }
}
const paddingDefault = (path) => {
    // 将path中所有的数字变成0
    path = path.map((certainPath) => typeof certainPath === 'number' ? 0 : certainPath)
    return mapValues(path.length === 0 ? defaultData : get(defaultData, path), (value) => isArray(value) ? [] : value)
}

function merge(versionId, data) {
    const sourceType = version[versionId]
    const targetType = version[HEAD]
    const sourceKeyValue = convertType2KeyValue([], sourceType)
    const targetKeyValue = convertType2KeyValue([], targetType)
    get(targetType, ["productList", 0, "score"]) //?
    return iterationMerge(targetType, [], sourceKeyValue, targetKeyValue, data, paddingDefault([])) // 最后的result可能有问题
    // 生成两个type成 typeId: path的形式
    // 每一个变量进行match， 如果匹配了， 然后路径也不冲突的话就可以
    // 不冲突验证： 数量一致即可
    // 比如说某一个数据在一个map -> map -> list
    // 另一个数据在map -> map中就不匹配
    // 首先将匹配的数据拿到然后将data的灌入
    // 最后补充上默认数据
}

merge('3.10_1583736509582', defaultData) //?

exports = module.exports = merge